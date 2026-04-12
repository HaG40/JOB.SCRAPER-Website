# main.py
# activate && conda activate base
# uvicorn main:app --reload --port 5000

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
from PIL import Image
from pdf2image import convert_from_bytes
import pytesseract
import os
import re
from io import BytesIO
from pydantic import BaseModel
import base64

pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=API_KEY)

conversation_history = []
resume_uploaded = False
resume_cache = ""
interview_history = []

def extract_text(uploaded_file) -> str:
    """Extract text from PDF or Image using OCR"""
    try:
        filename = uploaded_file.filename.lower()
        uploaded_file.file.seek(0)
        content = uploaded_file.file.read()

        if filename.endswith(".pdf"):
            images = convert_from_bytes(content, poppler_path=r"C:/Program Files/poppler-25.07.0/Library/bin")
            text = ""
            for img in images:
                text += pytesseract.image_to_string(img, lang="eng+tha") + "\n"
            return text.strip()

        elif filename.endswith((".png", ".jpg", ".jpeg")):
            image = Image.open(BytesIO(content))
            text = pytesseract.image_to_string(image, lang="eng+tha")
            return text.strip()

        else:
            return "❌ Unsupported file format"

    except Exception as e:
        return f"❌ Error extracting text: {str(e)}"

def extract_scores(text: str):
    pattern = r'(\d+(?:\.\d+)?)%'
    matches = re.findall(pattern, text)
    return [float(m) for m in matches]

def file_to_base64(file: UploadFile) -> str:
    """
    แปลง UploadFile เป็น Base64
    - PDF (หน้าเดียว) → JPG → Base64 string
    - JPG/PNG → Base64 string
    """
    content_type = file.content_type
    file_bytes = file.file.read()
    file.file.close()

    if content_type == "application/pdf":
        images = convert_from_bytes(
            file_bytes,
            poppler_path=r"C:/Program Files/poppler-25.07.0/Library/bin"
        )
        img = images[0]
        buffer = BytesIO()
        img.save(buffer, format="JPEG")
        base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return base64_str

    elif content_type in ["image/jpeg", "image/jpg", "image/png"]:
        return base64.b64encode(file_bytes).decode("utf-8")
    else:
        raise ValueError("ไฟล์ต้องเป็น PDF, JPG หรือ PNG เท่านั้น")

@app.post("/analyze")
async def analyze_resume(resume_file: UploadFile = File(...)):
    global resume_uploaded, resume_cache, conversation_history, uploaded_base64_image

    uploaded_base64_image = file_to_base64(resume_file)
    resume_uploaded = True

    conversation_history.append({
        "role": "system",
        "content": f"นี่คือเรซูเม่ที่อัปโหลดล่าสุดของผู้ใช้:\n{resume_cache}"
    })

    prompt = f"""
คุณคือ AI Resume Analyzer ช่วยวิเคราะห์เรซูเม่ต่อไปนี้:

📝 **คำสั่ง:**
- ตวรจก่อนว่าไฟล์ที่อัปโหลดมาเป็นเรซูเม่หรือไม่ หากไม่ทำการแจ้งเตือน ว่าไฟล์นี้ไม่ใช่เรซูเม่ และสิ้นสุดทันทีโดยไม่ดำเนินการวิเคราะห์ข้อมูลใดๆต่อทั้งสิ้น
- ชี้จุดเด่นและทักษะที่สำคัญของผู้สมัคร
- สกิล/ความสามารถ/สกิล
- ชี้จุดที่ควรปรับปรุงเพื่อให้เรซูเม่สมบูรณ์ยิ่งขึ้น
- ให้คะแนนแต่ละส่วน (ทักษะ/ประสบการณ์/ความสมบูรณ์) พร้อม Emoji นำหน้าประโยค ดังนี้:
  - ✅ ครบถ้วน ตรงตามข้อกำหนด
  - ❌ ไม่ครบหรือขาดข้อมูลสำคัญ
  - ⚠️ ไม่ชัดเจนหรือข้อมูลไม่เพียงพอ
- ให้คะแนน **ความสมบูรณ์โดยรวม** ของเรซูเม่เป็น %
- จัดรูปแบบให้อ่านง่าย ใช้ bullet list เท่านั้นและแบ่งหัวข้อชัดเจน หนึ่งหัวข้อหนึ่งบรรทัด
- ทุกข้อความให้อยู่ใน **ภาษาไทย** และสามารถมี **ภาษาอังกฤษสั้นๆ** ได้ หากจำเป็น ห้ามมีตัวอักษรภาษาอื่นออกมาเด็ดขาด
"""

    answer = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": "คุณคือ HR AI Analyzer"},
            {"role": "user", "content": 
             [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{uploaded_base64_image}",
                    },
                },   
             ]
            },
        ],
        temperature=0.2,
        max_tokens=800,
    )

    report = answer.choices[0].message.content
    scores = extract_scores(report)

    conversation_history.append({"role": "assistant", "content": report})
    resume_cache = report

    return JSONResponse({
        "report": report,
        "scores": scores,
    })
class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
async def chat_with_ai(req: ChatRequest):
    global conversation_history, resume_uploaded, resume_cache, uploaded_base64_image

    user_message = req.message

    conversation_history.append({
        "role": "user",
        "content": user_message
    })

    try:
        prompt = f"""
- คุณคือ Job Assistant ของเว็บไซต์ Job.Scraper TH
- เว็บไซต์รวบรวมข้อมูลงานในประเทศไทยจาก JobBKK, JobTH, JobThai
- ตอบเป็นมิตร อ่านง่าย ใช้ Emoji เล็กน้อย
- ไม่ต้องสวัสดีทุกครั้ง
- ถ้าเกี่ยวข้องกับเรซูเม่ ให้ใช้เรซูเม่ล่าสุดที่ผู้ใช้อัปโหลด
- จัดรูปแบบเป็น bullet list
- ใช้ภาษาไทยเป็นหลัก (อังกฤษสั้น ๆ ได้)
- ห้ามเริ่มสัมภาษณ์เองเด็ดขาด (แค่ "อธิบายโหมดสัมภาษณ์" ได้)

ผู้ใช้ถาม:
{user_message}

📄 บริบท:
{"มีเรซูเม่แล้ว" if resume_uploaded else "ยังไม่มีเรซูเม่"}
"""

        # 🔹 ถ้ามีเรซูเม่ → ส่ง image เข้าไปด้วย
        if resume_uploaded and uploaded_base64_image:
            messages = [
                {"role": "system", "content": "คุณคือ AI Job Assistant"},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{uploaded_base64_image}",
                            },
                        },
                    ],
                },
            ]
        else:
            messages = [
                {"role": "system", "content": "คุณคือ AI Job Assistant"},
                {"role": "user", "content": prompt},
            ]

        answer = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            temperature=0.4,
            max_tokens=500,
        )

        response_text = answer.choices[0].message.content

    except Exception as e:
        response_text = f"❌ เกิดข้อผิดพลาด: {str(e)}"

    conversation_history.append({
        "role": "assistant",
        "content": response_text
    })

    return JSONResponse({
        "reply": response_text,
        "history": conversation_history[-5:]
    })


@app.post("/recommend/cv")
async def recommend_job_by_cv(resume_file: UploadFile = File(...)):
    global conversation_history

    resume_file.file.seek(0)
    resume_text = extract_text(resume_file)

    resume_file.file.seek(0)
    base64_image = file_to_base64(resume_file)

    prompt = """
คุณคือ AI Resume Analyzer

📝 คำสั่ง:
- แนะนำงานที่เหมาะสมกับผู้สมัครตามเรซูเม่ที่ให้มา จำนวน 5 ตำแหน่ง
- ใช้รูปแบบ: Job1,Job2,Job3,Job4,Job5
- หลีกเลี่ยงคำว่า Junior, Senior, Intern
- ชื่อตำแหน่งไม่เกิน 2 คำ
- ห้ามอธิบายเพิ่ม ตอบเฉพาะรายชื่อตำแหน่งเท่านั้น
"""

    answer = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": "คุณคือ HR AI Analyzer"},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    },
                ],
            },
        ],
        temperature=0.2,
        max_tokens=200,
    )

    response = answer.choices[0].message.content.strip()

    jobs = [j.strip() for j in response.split(",") if j.strip()]
    jobs = jobs[:5]

    return JSONResponse({
        "reply": ",".join(jobs),
        "jobs": jobs,
    })
