# main.py
# activate && conda activate base
# uvicorn main:app --reload --port 5000

from fastapi import FastAPI, File, Response, UploadFile, Form
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
from fastapi import Body

pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
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
คุณคือ AI Resume Keyword Analyzer

📝 ขั้นตอนการวิเคราะห์:
1. อ่านเรซูเม่/CV ที่ให้มาอย่างละเอียด
2. สกัดคำสำคัญ (Keywords) ทั้งหมดจากเรซูเม่ ได้แก่
   - ทักษะเทคนิค (Hard Skills) เช่น Python, SQL, Photoshop
   - ทักษะทั่วไป (Soft Skills) เช่น Leadership, Communication
   - ประสบการณ์และตำแหน่งงานที่ผ่านมา
   - วุฒิการศึกษาและสาขาวิชา
   - เครื่องมือและซอฟต์แวร์ที่ใช้
   - ใบรับรองและ Certifications
3. จัดลำดับ Keyword โดยพิจารณาจากเกณฑ์ต่อไปนี้ตามลำดับความสำคัญ:
   1. ความถี่ (Frequency): Keyword ที่ปรากฏหลายครั้งในเรซูเม่มีน้ำหนักสูงกว่า
   2. ตำแหน่งที่ปรากฏ (Position): Keyword ในหัวข้อ Skills / Summary / ชื่อตำแหน่งงาน
      มีน้ำหนักมากกว่า Keyword ที่อยู่ใน body text ทั่วไป
   3. ระยะเวลาประสบการณ์ (Duration): ทักษะที่มีประสบการณ์นานกว่า มีน้ำหนักสูงกว่า
   4. ความเฉพาะเจาะจง (Specificity): คำเฉพาะทาง (เช่น TensorFlow, Kubernetes)
      มีน้ำหนักมากกว่าคำทั่วไป (เช่น Coding, Computer)
4. นำ Keyword ที่มีน้ำหนักมากที่สุดมาพิจารณาแนะนำตำแหน่งงาน
   โดยตำแหน่งงานอันดับ 1 ต้องตรงกับ Keyword หลักมากที่สุด
   และลดหลั่นลงไปจนถึงอันดับ 5 ที่ตรงกับ Keyword รองลงมา

⚠️ รูปแบบการตอบ:
- ตอบเฉพาะชื่อตำแหน่งงาน 5 อันดับเท่านั้น
- คั่นด้วยเครื่องหมายจุลภาค (,)
- ห้ามอธิบาย ห้ามใส่หมายเลข ห้ามใส่ข้อความอื่นใดทั้งสิ้น
- ตัวอย่างรูปแบบ: Data Analyst,Python Developer,Business Intelligence,Data Engineer,Machine Learning Engineer
"""

    answer = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": (
                    "คุณคือ HR AI Analyzer ที่เชี่ยวชาญการวิเคราะห์ Keyword จากเรซูเม่ "
                    "และจับคู่กับตำแหน่งงานที่เหมาะสมที่สุดตามน้ำหนักของ Keyword"
                )
            },
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

from fastapi import UploadFile, File, Form
from pdf2image import convert_from_bytes
import base64, io, re

@app.options("/match")
async def preflight():
    return Response(status_code=200)

@app.post("/match")
async def match(
    resume_file: UploadFile = File(...),
    job_title: str = Form(...),
    job_detail: str = Form(...)
):
    try:
        file_bytes = await resume_file.read()
        content_type = resume_file.content_type

        # ✅ รองรับทั้ง PDF และ Image
        if content_type == "application/pdf":
            pages = convert_from_bytes(
                file_bytes,
                dpi=300,
                poppler_path=r"C:/Program Files/poppler-25.07.0/Library/bin"
            )
            images = pages

        elif content_type in ["image/jpeg", "image/png", "image/jpg"]:
            images = [Image.open(BytesIO(file_bytes))]

        else:
            return JSONResponse(
                {"error": f"Unsupported file type: {content_type}"},
                status_code=400
            )

        # ✅ แปลงทุกหน้าเป็น base64
        images_base64 = []
        for img in images:
            buf = BytesIO()
            img.save(buf, format="JPEG")
            images_base64.append(base64.b64encode(buf.getvalue()).decode())

        # ✅ System Prompt แบบ ATS ภาษาไทย
        system_prompt = """คุณคือผู้เชี่ยวชาญระบบ ATS (Applicant Tracking System) สำหรับคัดกรองเรซูเม่และ CV กรุณาประเมินเรซูเม่ตามเกณฑ์มาตรฐาน ATS ดังต่อไปนี้:

1. การจับคู่คำสำคัญ (Keyword Matching)
   - ตรวจสอบว่าเรซูเม่มีคำสำคัญจาก Job Description หรือไม่
   - ครอบคลุม ทักษะ, เครื่องมือ, ใบรับรอง, ตำแหน่งงาน
   - คำนวณเปอร์เซ็นต์ความตรงกัน และระบุคำสำคัญที่มี/ขาดหายไป

2. ประสบการณ์ทำงาน (Work Experience)
   - ตรวจสอบชื่อตำแหน่ง, บริษัท, ช่วงเวลาทำงาน
   - ประเมินความสอดคล้องกับตำแหน่งที่สมัคร
   - ตรวจสอบว่าเรียงแบบ Reverse Chronological (ล่าสุดก่อน) หรือไม่

3. การศึกษา (Education)
   - ตรวจสอบระดับการศึกษา, สาขาวิชา, สถาบัน, ปีที่จบ
   - ประเมินว่าตรงกับข้อกำหนดใน Job Description หรือไม่
   - รวมถึง Certifications และใบรับรองที่เกี่ยวข้อง

4. ทักษะ (Skills)
   - แยกประเภท Hard Skills (ทักษะเฉพาะด้าน/เทคนิค) และ Soft Skills (ทักษะสังคม)
   - ตรวจสอบว่าครบถ้วนและตรงกับความต้องการของตำแหน่งหรือไม่

5. รูปแบบและโครงสร้าง (Format & Structure)
   - ตรวจสอบปัญหาที่ทำให้ ATS อ่านไม่ออก เช่น ตาราง, กราฟิก, หลายคอลัมน์, รูปภาพ
   - ตรวจสอบหัวข้อมาตรฐาน เช่น "ประสบการณ์ทำงาน", "การศึกษา", "ทักษะ", "สรุปประวัติ"
   - ตรวจสอบข้อมูลติดต่อ: ชื่อ, อีเมล, เบอร์โทรศัพท์, ที่อยู่

การคำนวณคะแนนรวม (0-100):
┌─────────────────────────────────────────────────────────┐
│ หมวด           │ น้ำหนัก │ วิธีคำนวณ                   │
├─────────────────────────────────────────────────────────┤
│ KEYWORD        │ 35 คะแนน│ (จำนวน keyword ที่ตรงกับ JD  │
│                │         │  ÷ keyword ทั้งหมดใน JD) × 35│
├─────────────────────────────────────────────────────────┤
│ EXPERIENCE     │ 30 คะแนน│ เปรียบเทียบประสบการณ์ที่มี   │
│                │         │ กับที่ JD ระบุ (ตำแหน่ง,     │
│                │         │ ระยะเวลา, ความเกี่ยวข้อง)    │
├─────────────────────────────────────────────────────────┤
│ EDUCATION      │ 25 คะแนน│ เปรียบเทียบวุฒิ, สาขา,      │
│                │         │ Certifications กับที่ JD ระบุ│
├─────────────────────────────────────────────────────────┤
│ FORMAT_ISSUES  │ 10 คะแนน│ หักตามปัญหา Format ที่พบ    │
│                │         │ (ไม่มีปัญหา = 10 เต็ม)       │
└─────────────────────────────────────────────────────────┘
คะแนนรวม = คะแนน KEYWORD + EXPERIENCE + EDUCATION + FORMAT_ISSUES

ตอบกลับตาม FORMAT นี้เท่านั้น ห้ามเพิ่มข้อความนอก FORMAT:

[SCORE]
(คะแนนรวม 0-100)
KEYWORD: (X/35) | EXPERIENCE: (X/30) | EDUCATION: (X/25) | FORMAT: (X/10)

[SCORE]
(ตัวเลข 0-100 เท่านั้น)

[KEYWORD]
คำสำคัญที่มี: (รายการ keyword ที่พบในเรซูเม่และตรงกับ JD)
คำสำคัญที่ขาด: (รายการ keyword ที่อยู่ใน JD แต่ไม่พบในเรซูเม่)

[EXPERIENCE]
ประเมิน: (สรุปประสบการณ์ที่มีและความสอดคล้องกับตำแหน่ง)
ควรเพิ่มเติม: (ระบุประเภทประสบการณ์ที่ยังขาดและจำเป็นสำหรับตำแหน่งนี้)
ตัวอย่างประสบการณ์ที่เกี่ยวข้อง:
- (ตัวอย่างที่ 1 เช่น "เคยรับผิดชอบวิเคราะห์ข้อมูลยอดขายรายเดือนด้วย Python และนำเสนอต่อทีมบริหาร")
- (ตัวอย่างที่ 2)
- (ตัวอย่างที่ 3)

[EDUCATION]
ประเมิน: (สรุปวุฒิการศึกษาและความตรงกับข้อกำหนด)
สาขาวิชาที่ตำแหน่งนี้ต้องการ: (ระบุสาขาที่เกี่ยวข้องและเป็นที่ต้องการ เช่น วิทยาการคอมพิวเตอร์, สถิติ, วิศวกรรมศาสตร์)
ทักษะเชิงวิชาการที่ควรมี: (ระบุทักษะหรือความรู้เฉพาะด้านที่งานนี้คาดหวังจากวุฒิการศึกษา เช่น Statistics, Database Design, Financial Modeling)

[FORMAT_ISSUES]
ปัญหาที่พบ: (ระบุปัญหาด้านรูปแบบที่ ATS อาจอ่านไม่ออก หรือ "ไม่พบปัญหา")
วิธีแก้ไข:
- (วิธีแก้ปัญหาที่ 1 เช่น "เปลี่ยน layout จาก 2 คอลัมน์เป็น 1 คอลัมน์เพื่อให้ ATS อ่านได้ถูกต้อง")
- (วิธีแก้ปัญหาที่ 2 เช่น "แทนที่ progress bar ทักษะด้วยข้อความระบุระดับ เช่น Intermediate, Advanced")
- (วิธีแก้ปัญหาที่ 3 หากมี)

[ADVICE]
สิ่งที่ขาดและทำให้ไม่เหมาะสมกับงานนี้:
- (ระบุสิ่งที่ขาดชัดเจน เช่น "ขาดประสบการณ์ด้าน Machine Learning ซึ่งเป็นข้อกำหนดหลักของตำแหน่ง")
- (ระบุสิ่งที่ขาดข้อที่ 2)
- (ระบุสิ่งที่ขาดข้อที่ 3 หากมี)
ตัวอย่างวิธีการแก้ไข:
- (วิธีแก้ที่ 1 เช่น "เพิ่ม Certifications ด้าน Machine Learning เช่น Google ML Certificate หรือ Coursera ML Specialization")
- (วิธีแก้ที่ 2 เช่น "เพิ่ม Project ส่วนตัวที่ใช้ทักษะที่ขาด เช่น สร้าง Portfolio บน GitHub")
- (วิธีแก้ที่ 3 หากมี)"""

        # ✅ User Prompt พร้อม Job Description
        user_prompt = f"""กรุณาประเมินเรซูเม่ต่อไปนี้ตามเกณฑ์ ATS โดยเทียบกับรายละเอียดงานที่ให้ไว้

รายละเอียดงาน (Job Description):
ชื่อตำแหน่ง: {job_title}
{job_detail}

เนื้อหาเรซูเม่/CV อยู่ในรูปภาพที่แนบมาด้านล่าง กรุณาอ่านและประเมินตามเกณฑ์ ATS ที่กำหนด"""

        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    *[
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img}"
                            }
                        }
                        for img in images_base64
                    ]
                ]
            }
        ]

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            temperature=0.2,
            max_tokens=1200,
        )

        result = response.choices[0].message.content

        # ✅ Parse ผลลัพธ์ตาม FORMAT ใหม่
        score_match    = re.search(r"\[SCORE\]\s*(\d+)\s*\n.*?KEYWORD:\s*\(?([\d.]+)/35\)?.*?EXPERIENCE:\s*\(?([\d.]+)/30\)?.*?EDUCATION:\s*\(?([\d.]+)/25\)?.*?FORMAT:\s*\(?([\d.]+)/10\)?", result, re.S)
        keyword_match  = re.search(r"\[KEYWORD\]\s*(.*?)\s*\[EXPERIENCE\]", result, re.S)
        exp_match      = re.search(r"\[EXPERIENCE\]\s*(.*?)\s*\[EDUCATION\]", result, re.S)
        edu_match      = re.search(r"\[EDUCATION\]\s*(.*?)\s*\[FORMAT_ISSUES\]", result, re.S)
        format_match   = re.search(r"\[FORMAT_ISSUES\]\s*(.*?)\s*\[ADVICE\]", result, re.S)
        advice_match   = re.search(r"\[ADVICE\]\s*(.*)", result, re.S)

        score = int(score_match.group(1).strip()) if score_match else 0
        verdict = "ผ่านเกณฑ์" if score >= 75 else "ควรทบทวน" if score >= 50 else "ไม่ผ่านเกณฑ์"

        return {
            "score":          score,
            "score_breakdown": {
                "keyword":    float(score_match.group(2)) if score_match else 0,
                "experience": float(score_match.group(3)) if score_match else 0,
                "education":  float(score_match.group(4)) if score_match else 0,
                "format":     float(score_match.group(5)) if score_match else 0,
            },
            "keyword":        keyword_match.group(1).strip() if keyword_match else "",
            "experience":     exp_match.group(1).strip()     if exp_match     else "",
            "education":      edu_match.group(1).strip()     if edu_match     else "",
            "format_issues":  format_match.group(1).strip()  if format_match  else "",
            "advice":         advice_match.group(1).strip()  if advice_match  else "",
            "verdict":        verdict
        }

    except Exception as e:
        print("MATCH ERROR:", e)
        return JSONResponse({"error": str(e)}, status_code=500)