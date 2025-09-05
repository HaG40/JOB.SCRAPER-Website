# main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pdfminer.high_level import extract_text
from groq import Groq
import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="AI Resume Analyzer API")

# Enable CORS for development/testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Helper Functions ----------
def extract_pdf_text(uploaded_file) -> str:
    """Extract text from uploaded PDF file."""
    try:
        return extract_text(uploaded_file.file)
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def get_report(resume: str, job_desc: str) -> str:
    """Send prompt to Groq LLM and get analysis report."""
    client = Groq(api_key=API_KEY)
    prompt = f"""
# บริบท (Context):
- คุณคือตัววิเคราะห์เรซูเม่ AI (AI Resume Analyzer) คุณจะได้รับเรซูเม่ของผู้สมัครและรายละเอียดงาน (Job Description) ของตำแหน่งที่ผู้สมัครกำลังสมัคร

# คำสั่ง (Instruction):
- วิเคราะห์เรซูเม่ของผู้สมัครโดยอ้างอิงจากข้อมูลและจุดที่สำคัญจากรายละเอียดงาน และให้การประเมินแต่ละจุดตามเกณฑ์ดังนี้:
- พิจารณาทุกจุด เช่น ทักษะที่ต้องมี, ประสบการณ์ ฯลฯ ที่จำเป็นสำหรับตำแหน่งงานนั้น
- ให้คะแนนแต่ละจุด (เต็ม 5) โดยเริ่มด้วยการประเมินคะแนนที่จุดนั้น พร้อมคำอธิบายละเอียด
- หากเรซูเม่ตรงกับจุดของรายละเอียดงาน ให้ใส่ ✅ และอธิบายเหตุผลอย่างละเอียด
- หากเรซูเม่ไม่ตรงกับจุดของรายละเอียดงาน ให้ใส่ ❌ และให้เหตุผลว่าทำไม
- หากไม่สามารถสรุปได้ชัดเจน ให้ใช้ ⚠️ พร้อมเหตุผล
- หัวข้อสุดท้ายให้ใช้ชื่อว่า "ข้อเสนอแนะในการปรับปรุงเรซูเม่:" และแนะนำจุดที่ผู้สมัครควรปรับปรุงเพื่อให้มีโอกาสถูกเลือกสำหรับตำแหน่งนั้น

# ข้อมูลนำเข้า (Inputs):
เรซูเม่ผู้สมัคร: {resume}
---
รายละเอียดงาน: {job_desc}

# ผลลัพธ์ที่ต้องการ (Output):
- ทุกจุดควรมีคะแนน (ตัวอย่าง: 3/5)
- เริ่มแต่ละจุดด้วยคะแนนและ Emoji ที่เกี่ยวข้อง ตามด้วยคำอธิบายเหตุผล
- ให้ผลลัพธ์ทั้งหมดเป็น **ภาษาไทย**
"""
    completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
    )
    return completion.choices[0].message.content

def extract_scores(text: str):
    """Extract all scores from text in format x/5."""
    pattern = r'(\d+(?:\.\d+)?)/5'
    matches = re.findall(pattern, text)
    return [float(m) for m in matches]

# ---------- FastAPI Route ----------
@app.post("/analyze")
async def analyze_resume(resume_file: UploadFile = File(...), job_desc: str = Form(...)):
    # Extract text from PDF
    resume_text = extract_pdf_text(resume_file)

    # Get LLM report
    report = get_report(resume_text, job_desc)

    # Extract scores
    scores = extract_scores(report)
    avg_score = sum(scores) / (len(scores)*5) if scores else None

    return JSONResponse({
        "resume_text": resume_text[:500],  # แสดงแค่ตัวอย่าง 500 ตัวแรก
        "report": report,
        "scores": scores,
        "average_score": avg_score
    })
