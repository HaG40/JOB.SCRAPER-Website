# uvicorn main:app --reload --port 5000

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pdfminer.high_level import extract_text
from groq import Groq
import os
import re
from dotenv import load_dotenv
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="AI Resume Analyzer + Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=API_KEY)

# Session เก็บ conversation history สำหรับแชท
conversation_history = [
    {"role": "system", "content": "คุณคือ AI Chatbot ชื่อว่า Job Assistant ที่ตอบกลับบทสนทนาเป็นภาษาไทย โดยในการสนทนาคุณจะมีบทบาทเป็นผู้หญิง ที่สามารถพูดคุยทั่วไปได้ และสามารถวิเคราะห์เรซูเม่กับ Job Description ได้เมื่อมีการอัปโหลด"}
]

resume_uploaded = False
resume_cache = ""

def extract_pdf_text(uploaded_file) -> str:
    """Extract text from uploaded PDF file."""
    try:
        return extract_text(uploaded_file.file)
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"


def get_report(resume: str, job_desc: str) -> str:
    """ส่ง prompt ไปยัง Groq LLM เพื่อวิเคราะห์เรซูเม่"""
    global conversation_history, resume_uploaded

    prompt = f"""
# บริบท (Context):
- คุณคือตัววิเคราะห์เรซูเม่ AI ในประเทศไทย (AI Resume Analyzer) คุณจะได้รับเรซูเม่ของผู้สมัครและรายละเอียดงาน (Job Description) ของตำแหน่งที่ผู้สมัครกำลังสมัคร

# คำสั่ง (Instruction):
- วิเคราะห์เรซูเม่ของผู้สมัครโดยอ้างอิงจากข้อมูลและจุดที่สำคัญจากรายละเอียดงาน และให้การประเมินแต่ละจุดตามเกณฑ์ดังนี้:
- พิจารณาทุกจุด เช่น ทักษะที่ต้องมี, ประสบการณ์ ฯลฯ ที่จำเป็นสำหรับตำแหน่งงานนั้น
- ให้คะแนนแต่ละจุด (เป็น format 2d.ff%) โดยเริ่มด้วยการประเมินคะแนนที่จุดนั้น พร้อมคำอธิบายละเอียด
- หากเรซูเม่ตรงกับจุดของรายละเอียดงาน ให้ใส่ ✅ และอธิบายเหตุผลอย่างละเอียด
- หากเรซูเม่ไม่ตรงกับจุดของรายละเอียดงาน ให้ใส่ ❌ และให้เหตุผลว่าทำไม
- หากไม่สามารถสรุปได้ชัดเจน ให้ใช้ ⚠️ พร้อมเหตุผล
- หัวข้อสุดท้ายให้ใช้ชื่อว่า "ข้อเสนอแนะในการปรับปรุงเรซูเม่:" และแนะนำจุดที่ผู้สมัครควรปรับปรุงเพื่อให้มีโอกาสถูกเลือกสำหรับตำแหน่งนั้น

# ข้อมูลนำเข้า (Inputs):
เรซูเม่ผู้สมัคร: {resume}
---
รายละเอียดงาน: {job_desc}

# ผลลัพธ์ที่ต้องการ (Output):
- ทุกจุดควรมีคะแนน (ตัวอย่าง: 51.98%)
- เริ่มแต่ละจุดด้วยคะแนนและ Emoji ที่เกี่ยวข้อง ตามด้วยคำอธิบายเหตุผล
- ให้ผลลัพธ์ทั้งหมดเป็น **ภาษาไทย** และ **ภาษาอังกฤษ* หากจำเป็น แต่ห้ามมีตัวอักษรภาษาอื่นเด็ดขาด
"""

    answer = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "คุณคือผู้ช่วย AI วิเคราะห์เรซูเม่เชิง HR"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=800,
    )
    return answer.choices[0].message.content


def extract_scores(text: str):
    """
    Extract all scores from text in format xx.xx%
    Example: "82.69%" -> 82.69
    """
    pattern = r'(\d+(?:\.\d+)?)%'
    matches = re.findall(pattern, text)
    scores_percent = [float(m) for m in matches]
    return scores_percent


@app.post("/analyze")
async def analyze_resume(resume_file: UploadFile = File(...), job_desc: str = Form(...)):
    """วิเคราะห์ Resume กับ JD"""
    global resume_uploaded, resume_cache

    resume_text = extract_pdf_text(resume_file)
    resume_cache = resume_text
    resume_uploaded = True

    report = get_report(resume_text, job_desc)

    scores = extract_scores(report)
    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    return JSONResponse({
        "resume_text": resume_text[:500], 
        "report": report,
        "scores": scores,
        "average_score": avg_score
    })


@app.post("/chat")
async def chat_with_ai(req: ChatRequest):
    user_message = req.message
    """
    Chatbot ที่สามารถพูดคุยทั่วไปได้
    ถ้ามี Resume อัปโหลดแล้ว จะตอบโดยใช้ข้อมูลนั้นประกอบ
    """
    global conversation_history, resume_uploaded, resume_cache

    if resume_uploaded:
        user_content = f"{user_message}\n\n(บริบทเพิ่มเติม: เรซูเม่ที่อัปโหลดล่าสุดคือ {resume_cache[:400]}...)"
    else:
        user_content = user_message

    conversation_history.append({"role": "user", "content": user_content})

    try:
        answer = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=conversation_history,
            temperature=0.4,
            max_tokens=500,
        )

        response_text = answer.choices[0].message.content
    except Exception as e:
        response_text = f"❌ เกิดข้อผิดพลาด: {str(e)}"

    # เพิ่มข้อความของ assistant ลง history
    conversation_history.append({"role": "assistant", "content": response_text})

    # ส่งกลับล่าสุด 5 ข้อความเพื่อแสดงผลใน frontend
    return JSONResponse({
        "reply": response_text,
        "history": conversation_history[-5:]
    })
