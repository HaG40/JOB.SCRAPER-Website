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
from fastapi import UploadFile, File, Form
from pdf2image import convert_from_bytes
import base64, io, re

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


@app.post("/recommend/cv")
async def recommend_job_by_cv(resume_file: UploadFile = File(...)):
    global conversation_history

    resume_file.file.seek(0)
    resume_text = extract_text(resume_file)

    resume_file.file.seek(0)
    base64_image = file_to_base64(resume_file)

    prompt = """📝 ขั้นตอนการวิเคราะห์:

อ่านเรซูเม่/CV ที่ให้มาอย่างละเอียด
แยกข้อความเรซูเม่ออกเป็นหน่วยคำ (tokenization) และทำความสะอาดข้อความ (lowercase, remove stopwords, normalize)
คำนวณน้ำหนักของทุกคำสำคัญด้วยหลัก TF-IDF โดย:
TF (Term Frequency): คำที่ปรากฏบ่อยในเรซูเม่มีค่าสูง
IDF (Inverse Document Frequency): คำเฉพาะทางมีค่าสูงกว่าคำทั่วไป
ปรับน้ำหนัก TF-IDF เพิ่มตามบริบทตำแหน่งที่พบคำ:
คำที่อยู่ในหัวข้อ Skills, Summary, Job Title, Certifications, Education ให้ค่าน้ำหนักเพิ่ม
คำที่อยู่ในเนื้อหาประสบการณ์งานให้ค่าน้ำหนักปานกลาง
รวมคำที่มีความหมายใกล้เคียงกัน (เช่น Python Developer, Python Programming → Python)
จัดอันดับ Keyword ตามค่าน้ำหนัก TF-IDF ที่ได้
นำ Keyword ที่มีค่าน้ำหนักสูงสุดไปจับคู่กับตำแหน่งงานที่สอดคล้องมากที่สุด
อนุญาตให้ชื่อตำแหน่งงานซ้ำกันได้ หาก TF-IDF บ่งชี้ว่าตรงกับงานนั้นมากที่สุด
อันดับเรียงจากความสอดคล้องสูงสุดไปต่ำสุด

⚠️ รูปแบบการตอบ:

ตอบเฉพาะชื่อตำแหน่งงาน 5 อันดับเท่านั้น
คั่นด้วยเครื่องหมายจุลภาค (,)
ห้ามอธิบาย ห้ามใส่หมายเลข ห้ามใส่ข้อความอื่นใดทั้งสิ้น
ตัวอย่างรูปแบบ: Data Analyst,Python Developer,Business Intelligence,Data Engineer,Machine Learning Engineer
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
        temperature=0.1,
        max_tokens=200,
    )

    response = answer.choices[0].message.content.strip()

    jobs = [j.strip() for j in response.split(",") if j.strip()]
    jobs = jobs[:5]

    return JSONResponse({
        "reply": ",".join(jobs),
        "jobs": jobs,
    })

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
        system_prompt = """คุณคือที่ปรึกษาด้านเรซูเม่มืออาชีพ วิเคราะห์เรซูเม่เทียบกับ JD ที่ให้มา ให้คำแนะนำเชิงลึกที่ปฏิบัติได้จริง ไม่ให้คะแนน ไม่วิเคราะห์ Format/รูปแบบเอกสาร

=== หลักการเขียนเรซูเม่ที่ดี (Jobsdb Thailand) ===
ควรทำ: แบ่งส่วนชัดเจน (ข้อมูลส่วนตัว/Career Summary/ประสบการณ์/การศึกษา/ทักษะ) | ภาษากระชับตรงประเด็น | Active Words (ถ้าเป็นภาษาอังกฤษ) | ผลงานเป็นตัวเลขวัดได้ | Reverse Chronological | Career Summary 2-3 บรรทัดตอบ "ทำไมจ้างคุณ?" | ระบุ Certifications ที่เกี่ยวข้อง | ตรวจสะกดและข้อมูลติดต่อ

ห้ามทำ: คำคุณศัพท์ลอยไม่มีหลักฐาน | ข้อมูลส่วนตัวไม่จำเป็น (ศาสนา/น้ำหนัก/ส่วนสูง/สถานภาพ ยกเว้นสายการบิน) | เหตุผลลาออก | ข้อมูลเท็จ | อีเมลไม่เป็นทางการ | หน้าที่งานกว้างไม่มีผลงานรองรับ | ข้อมูลซ้ำซ้อนหรือยาวเกิน 3 หน้า | ภาษาพูด/สไตล์โซเชียล

Soft Skills ที่ HR สำคัญ: Communication | Collaboration | Decision Making & Problem Solving | Negotiation | Time Management | Adaptability & Active Learning

แนวทางตามสายงาน:
- ครีเอทีฟ: ซอฟต์แวร์และระดับความเชี่ยวชาญ
- คอนเทนต์: ตัวเลขผลลัพธ์ (Engagement/Growth Rate) + ประเภทคอนเทนต์
- ภาษา: ระดับทักษะ + ผลสอบ (TOEIC/IELTS/JLPT) + ประเภทงานแปล/ล่าม
- การตลาด: ตัวเลข Campaign + เครื่องมือ (Google Analytics/SEO) + ประสบการณ์ข้ามทีม
- บัญชี: ซอฟต์แวร์ (SAP/Express) + ใบรับรอง (CPA) + มูลค่าบัญชี + ประสบการณ์ภาษี
- ไอที: Tech Stack + โปรเจกต์พร้อมผลลัพธ์ + Certifications (AWS/Microsoft)
- การบิน: Soft Skills + ภาษา + ใบรับรองความปลอดภัย + ส่วนสูง/น้ำหนัก
- วิทย์: งานวิจัย + ทักษะห้องแล็บ + ผลงานตีพิมพ์ + ใบอนุญาต
- ช่าง: เครื่องมือ + โครงการ + ขนาดงาน + ใบรับรองความปลอดภัย

Career Summary ที่ดี: (1) ตำแหน่ง/ระดับประสบการณ์ (2) ทักษะ/ความสำเร็จที่เกี่ยวข้อง (3) เป้าหมายอาชีพ

=== Hard Disqualifier — ไม่เหมาะสมทันที ===
วุฒิการศึกษา:
- JD Require ป.โท → ป.ตรีหรือต่ำกว่า = ไม่ผ่าน
- JD Require ป.เอก → ต่ำกว่า ป.เอก = ไม่ผ่าน
- JD Require สาขาเฉพาะ → จบสาขาอื่น = ไม่ผ่าน (ยกเว้นมีประสบการณ์/ใบรับรองชดเชย)
- JD Require ม.ปลาย/ปวช./ปวส.:
  → วุฒิต่ำกว่า = ไม่ผ่าน | วุฒิเท่ากัน = ผ่าน | วุฒิสูงกว่า (ป.ตรีขึ้นไป) = ผ่าน แต่แนะนำหางานที่ตรงวุฒิมากกว่าเพื่อโอกาสและค่าตอบแทนที่ดีกว่า

ประสบการณ์:
- JD Require ขั้นต่ำ (เช่น 3-5 ปี) → ไม่มีหรือน้อยกว่า = ไม่ผ่าน
- JD รับ Fresh Graduate / ไม่ Require ประสบการณ์:
  → ไม่มีประสบการณ์ = ผ่าน ทักษะถือเป็นข้อดีเสริม
  → มีประสบการณ์มากกว่า = ผ่าน แต่แนะนำหางานที่ Require ประสบการณ์สูงกว่าเพื่อโอกาสที่ดีกว่า

อายุ:
- JD ระบุช่วงอายุ → อายุไม่ตรง = ไม่ผ่าน
- เรซูเม่ไม่ระบุอายุแต่ JD กำหนด → แจ้งให้ระบุอายุ

เพศ:
- JD ระบุเพศ → เพศไม่ตรง = ไม่ผ่าน
- เรซูเม่ไม่ระบุเพศแต่ JD กำหนด → แจ้งให้ระบุเพศ

=== เกณฑ์วิเคราะห์ (3 มิติ) ===
1. Job Relevance: ข้อมูลติดต่อ | อายุ/เพศตรง JD | Career Summary ตอบโจทย์ตำแหน่ง | เนื้อหาสอดคล้อง JD | ข้อมูลที่ไม่ควรมี
2. Work Experience: ชื่อตำแหน่ง/บริษัท/ช่วงเวลาชัดเจน | ปีประสบการณ์ตาม JD | ผลงานตัวเลขวัดได้ | Active Words | หน้าที่เฉพาะเจาะจง | Reverse Chronological
3. Skills & Education: วุฒิ/สาขาตาม JD | Hard Skills (มีและตรง/มีบางส่วน/ขาด) | Soft Skills | คำคุณศัพท์ลอย | Certifications

=== FORMAT (ตอบตามนี้เท่านั้น) ===

[RELEVANCE]
🔍 ประเมิน: ...

✅ จุดแข็ง: ... (Career Summary ที่ดีถือเป็นจุดแข็ง ข้อมูลติดต่อครบไม่นับ)

⚠️ สิ่งที่ขาดหรือควรปรับ: ...

[EXPERIENCE]
🔍 ประเมิน: ...

❌ ข้อกำหนดที่ไม่ผ่าน: ...

✅ จุดแข็ง: ... (ถ้า JD รับ Fresh Graduate แต่ผู้สมัครมีประสบการณ์ = ผ่าน แต่แนะนำหางานที่ Require สูงกว่า)

⚠️ ควรปรับปรุง: ...

ตัวอย่างการเขียนที่ดีกว่า:
- ...

[SKILLS]
🎓 วุฒิการศึกษา:

- JD กำหนด: ...

- ผู้สมัครมี: ...

- ผล: ✅ ผ่าน / ✅ ผ่าน (วุฒิสูงกว่า — แนะนำหางานที่ตรงวุฒิมากกว่า) / ❌ ไม่เหมาะสม — เหตุผล

สาขาวิชาที่ตำแหน่งคาดหวัง: ...

🛠️ Hard Skills:
- มีและตรง: ...
- มีบางส่วน: ...
- ขาด: ...

🤝 Soft Skills:
- มี: ...
- ขาด: ...

สิ่งที่ควรแก้ไขในส่วนทักษะ: ...

[SUMMARY]
ความเหมาะสม: ✅ เหมาะสม / ❌ ไม่เหมาะสม
📌 เหตุผล: ...
(ไม่ต้องสรุปภาพรวม)"""

        user_prompt = f"""กรุณาประเมินเรซูเม่ต่อไปนี้ตามเกณฑ์โดยเทียบกับรายละเอียดงานที่ให้ไว้

รายละเอียดงาน (Job Description):
ชื่อตำแหน่ง: {job_title}
{job_detail}

เนื้อหาเรซูเม่/CV อยู่ในรูปภาพที่แนบมาด้านล่าง กรุณาอ่านและประเมินตามเกณฑ์ที่กำหนด"""

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
            max_tokens=2000,
        )

        result = response.choices[0].message.content

        relevance_match = re.search(r"\[RELEVANCE\]\s*(.*?)\s*\[EXPERIENCE\]", result, re.S)
        exp_match       = re.search(r"\[EXPERIENCE\]\s*(.*?)\s*\[SKILLS\]", result, re.S)
        skills_match    = re.search(r"\[SKILLS\]\s*(.*?)\s*\[SUMMARY\]", result, re.S)
        summary_match   = re.search(r"\[SUMMARY\]\s*(.*)", result, re.S)

        return {
            "relevance":  relevance_match.group(1) if relevance_match else "",
            "experience": exp_match.group(1)       if exp_match       else "",
            "skills":     skills_match.group(1) + "\n"    if skills_match    else "",
            "summary":    summary_match.group(1) if summary_match else "",
        }

    except Exception as e:
        print("MATCH ERROR:", e)
        return JSONResponse({"error": str(e)}, status_code=500)