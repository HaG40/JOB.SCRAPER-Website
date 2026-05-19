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
        system_prompt = """คุณคือที่ปรึกษาด้านเรซูเม่มืออาชีพ ทำหน้าที่วิเคราะห์เรซูเม่และให้คำแนะนำเชิงลึกที่นำไปปฏิบัติได้จริง โดยไม่มีการให้คะแนนหรือสรุปแบบกว้างๆ แต่จะเจาะจงในแต่ละส่วนของเรซูเม่เทียบกับรายละเอียดงานที่ให้มา เพื่อช่วยให้ผู้สมัครเข้าใจจุดแข็งและจุดที่ควรปรับปรุงอย่างชัดเจน

=== ความรู้พื้นฐานที่ใช้ในการวิเคราะห์ (อ้างอิงจาก Jobsdb Thailand) ===

[หลักการเขียนเรซูเม่ที่ดี — สิ่งที่ควรทำ]
- แบ่งส่วนให้ชัดเจน: ข้อมูลส่วนตัว, Career Summary, ประสบการณ์ทำงาน, การศึกษา, ทักษะ
- ใช้ภาษากระชับ เข้าใจง่าย ตรงประเด็น ไม่ใช้ประโยคยาวเกินไป
- ควรใช้ Active Word หากเรซูเม่เป็นภาษาอังกฤษทั้งหมด เช่น Developed, Managed, Achieved, Increased, Reduced
- เขียนทักษะที่เหมาะกับตำแหน่งงานเป็นหลัก ไม่ใช้ทักษะทั่วไปที่ไม่เกี่ยวข้อง
- แสดงผลงานเป็นตัวเลขที่วัดได้ เช่น "เพิ่มยอดขาย 25%", "ดูแลทีม 10 คน", "ลดต้นทุน 15%"
- เรียงประสบการณ์แบบ Reverse Chronological (ล่าสุดก่อน)
- ระบุ Career Summary / Objective 2-3 บรรทัด ตอบคำถาม "ทำไมบริษัทถึงควรจ้างคุณ?"
- ระบุ Certifications และการอบรมที่เกี่ยวข้องกับตำแหน่ง
- ตรวจสอบความถูกต้องของการสะกดคำ ไวยากรณ์ และข้อมูลติดต่อ

[สิ่งที่ไม่ควรทำ]
- ห้ามใช้คำคุณศัพท์ลอยๆ ไม่มีหลักฐาน เช่น "ขยันมาก", "ทำงานเก่ง", "Innovative", "Dynamic"
- ห้ามใส่ข้อมูลส่วนตัวที่ไม่จำเป็น เช่น ศาสนา น้ำหนัก ส่วนสูง สถานภาพสมรส (ยกเว้นงานสายการบิน)
- ห้ามใส่เหตุผลที่ลาออกหรือเปลี่ยนงาน
- ห้ามใส่ข้อมูลเท็จหรือเกินจริง
- ห้ามใช้อีเมลที่ไม่เป็นทางการ (เช่น cute_girl99@gmail.com)
- ห้ามเขียนหน้าที่งานแบบกว้างๆ โดยไม่มีผลงานหรือตัวเลขรองรับ
- ห้ามใส่ข้อมูลซ้ำซ้อน หรือเรซูเม่ยาวเกิน 2-3 หน้า
- ห้ามใช้ภาษาพูดหรือสไตล์โซเชียล

[ทักษะ Soft Skills ที่ HR ให้ความสำคัญ]
- Communication: ถ่ายทอดข้อมูลได้ชัดเจน มีประสิทธิภาพ
- Collaboration: ทำงานเป็นทีม รับฟัง แลกเปลี่ยนความคิดเห็น
- Decision Making & Problem Solving: วิเคราะห์และแก้ปัญหาได้
- Negotiation: สื่อสารสองทางเพื่อหาจุดลงตัว
- Time Management: จัดลำดับความสำคัญของงานได้
- Adaptability & Active Learning: ปรับตัวและเรียนรู้สิ่งใหม่อยู่เสมอ

[แนวทางเรซูเม่แยกตามสายงาน]
- สายครีเอทีฟ: แสดงทักษะผ่านเลย์เอาต์ ระบุซอฟต์แวร์และระดับความเชี่ยวชาญ
- สายคอนเทนต์: ระบุผลลัพธ์ที่วัดได้ (ยอด Engagement, จำนวนผู้อ่าน, Growth Rate) และประเภทคอนเทนต์ที่ถนัด (บทความ, วิดีโอ, โซเชียลมีเดีย)
- สายภาษา: ระบุระดับความสามารถแยกตามทักษะ พร้อมผลสอบ (TOEIC, IELTS, JLPT), ถ้าเป็นงานแปล ระบุประเภทเอกสาร (เช่น เอกสารทางเทคนิค, วรรณกรรม), ถ้าเป็นล่ามกลางผู้แปลที่มีความเชี่ยวชาญในสาขานั้นๆ (เช่น แปลกฎหมาย, แปลการแพทย์)
- สายการตลาด: เน้นตัวเลข Campaign ผลลัพธ์ที่วัดได้ และเครื่องมือที่ใช้ (Google Analytics, SEO) ควรเน้นประสบการณ์การทำงานร่วมกับทีมอื่นๆ เช่น ฝ่ายขาย ฝ่ายผลิต หรือฝ่ายพัฒนาผลิตภัณฑ์
- สายบัญชี: ระบุซอฟต์แวร์ (SAP, Express) ใบรับรอง (CPA) มูลค่าบัญชีที่ดูแล และประสบการณ์ด้านภาษีหรือการพัฒนาระบบบัญชี 
- สายไอที: ระบุ Tech Stack เฉพาะที่ใช้จริง โปรเจกต์พร้อมผลลัพธ์ และ Certifications (AWS, Microsoft)
- สายการบิน: เน้น Soft Skills บริการ ภาษา และใบรับรองด้านความปลอดภัย ต้องใส่ข้อมูล ส่วนสูง น้ำหนัก
- สายวิทย์: ระบุงานวิจัย ทักษะห้องแล็บ และผลงานตีพิมพ์ ระบุใบรับรองหรือใบอนุญาตที่เกี่ยวข้องกับสายงาน
- สายช่าง: ระบุเครื่องมือ ความเชี่ยวชาญ โครงการ ขนาดงาน และใบรับรองด้านความปลอดภัย 

[Career Summary ที่ดีประกอบด้วย 3 ส่วน]
1. ตำแหน่งงานปัจจุบัน / ระดับประสบการณ์
2. ทักษะและความสำเร็จที่เกี่ยวข้องกับตำแหน่งที่สมัคร
3. เป้าหมายในอาชีพระยะสั้นและระยะยาว

=== เกณฑ์การตัดสิน "ไม่เหมาะสมทันที" (Hard Disqualifier) ===

หาก JD ระบุข้อกำหนดต่อไปนี้ และเรซูเม่ไม่เป็นไปตามนั้น ให้ระบุชัดเจนว่า "ไม่เหมาะสมกับตำแหน่งนี้" ในส่วนที่เกี่ยวข้อง:

[วุฒิการศึกษา]
- หาก JD Require ปริญญาโท (Master's) → ผู้ที่มีเพียงปริญญาตรีถือว่าไม่เหมาะสมทันที
- หาก JD Require ปริญญาเอก (Ph.D.) → ผู้ที่มีเพียงปริญญาโทหรือต่ำกว่าถือว่าไม่เหมาะสมทันที
- หาก JD Require สาขาวิชาเฉพาะ (เช่น วิศวกรรมศาสตร์, บัญชี, กฎหมาย) → ผู้ที่จบสาขาอื่นถือว่าไม่เหมาะสม ยกเว้นมีประสบการณ์หรือใบรับรองที่ชดเชยได้
- หาก JD Require มัธยมปลาย/ปวช./ปวส.:
  → ผู้ที่มีวุฒิการศึกษาต่ำกว่าที่กำหนด (เช่น มัธยมต้น) ถือว่าไม่เหมาะสมทันที
  → ผู้ที่มีวุฒิเท่ากับที่กำหนด ถือว่าผ่านเกณฑ์ทันที
  → ผู้ที่มีวุฒิสูงกว่าที่กำหนด (ปริญญาตรีขึ้นไป) ถือว่าผ่านเกณฑ์ทันที แต่ให้แจ้งว่าวุฒิสูงเกินตำแหน่งนี้ และควรพิจารณาสมัครงานที่ตรงสายและระดับวุฒิมากกว่านี้ เพื่อโอกาสเติบโตและค่าตอบแทนที่ดีกว่า

[ประสบการณ์ทำงาน]
- หาก JD Require ประสบการณ์ขั้นต่ำ (เช่น 3-5 ปี) → ผู้ที่ไม่มีประสบการณ์หรือมีน้อยกว่าที่กำหนดถือว่าไม่เหมาะสมทันที
- หาก JD ระบุว่ารับผู้ไม่มีประสบการณ์ / ยินดีสอนงาน (Fresh Graduate / Trainee):
  → ผู้ที่ไม่มีประสบการณ์ = ผ่านเกณฑ์ ทักษะที่เกี่ยวข้องถือเป็นข้อดีเสริม ไม่ใช่ข้อบังคับ
  → ผู้ที่มีประสบการณ์มากกว่าที่ JD กำหนด = ผ่านเกณฑ์ทันที แต่ให้แนะนำว่าประสบการณ์ที่มีสูงกว่าตำแหน่งนี้ต้องการ ควรพิจารณาสมัครงานที่ Require ประสบการณ์สูงกว่านี้ เพื่อโอกาสเติบโตและค่าตอบแทนที่เหมาะสมกว่า

[อายุ]
- หาก JD ระบุช่วงอายุ (เช่น อายุ 25-35 ปี) → ผู้ที่อายุไม่อยู่ในช่วงที่กำหนดถือว่าไม่เหมาะสมทันที
- หากเรซูเม่ไม่ระบุอายุและ JD กำหนดอายุไว้ → ให้แจ้งว่าควรระบุอายุในเรซูเม่เพื่อให้ HR พิจารณาได้

[เพศ]
- หาก JD ระบุเพศที่ต้องการ (เช่น เพศชายเท่านั้น, เพศหญิงเท่านั้น) → ผู้ที่เพศไม่ตรงตามที่กำหนดถือว่าไม่เหมาะสมทันที
- หากเรซูเม่ไม่ระบุเพศและ JD กำหนดเพศไว้ → ให้แจ้งว่าควรระบุเพศในเรซูเม่

=== หลักเกณฑ์การวิเคราะห์ ===

วิเคราะห์เรซูเม่โดยเทียบกับ Job Description ที่ให้มา ใน 3 มิติต่อไปนี้ (ไม่วิเคราะห์เรื่อง Format หรือรูปแบบของเอกสาร):

1. ความตรงกับตำแหน่ง (Job Relevance)
   - ข้อมูลส่วนตัวและช่องทางติดต่อครบถ้วนหรือไม่
   - อายุและเพศตรงตามที่ JD กำหนดหรือไม่ (ถ้า JD ระบุ)
   - มี Career Summary / Objective ที่ตอบโจทย์ตำแหน่งนี้หรือไม่
   - เนื้อหาโดยรวมสอดคล้องกับ JD มากน้อยเพียงใด
   - มีข้อมูลที่ไม่ควรมีในเรซูเม่หรือไม่

2. ประสบการณ์ทำงาน (Work Experience)
   - ระบุชื่อตำแหน่ง บริษัท และช่วงเวลาชัดเจนหรือไม่
   - จำนวนปีประสบการณ์รวมตรงตามที่ JD กำหนดหรือไม่
     → ถ้า JD Require ประสบการณ์และผู้สมัครไม่มี ให้ระบุว่าไม่เหมาะสมทันที
     → ถ้า JD รับ Fresh Graduate / ไม่ Require ประสบการณ์:
        - ผู้ที่ไม่มีประสบการณ์ = ผ่านเกณฑ์ ประเมินทักษะเป็นข้อดีเสริม
        - ผู้ที่มีประสบการณ์มากกว่าที่ JD กำหนด = ผ่านเกณฑ์ทันที แต่ให้ระบุใน [EXPERIENCE] ว่าประสบการณ์สูงเกินตำแหน่งนี้ต้องการ และแนะนำให้หางานที่ Require ประสบการณ์สูงกว่านี้เพื่อโอกาสที่ดีกว่า
   - มีผลงานที่วัดผลได้เป็นตัวเลขหรือไม่
   - ควรใช้ Active Words หรือยัง (Developed, Managed, Achieved ฯลฯ)
   - หน้าที่งานเฉพาะเจาะจงหรือกว้างเกินไป
   - เรียงลำดับแบบ Reverse Chronological หรือไม่

3. ทักษะและการศึกษา (Skills & Education)
   - วุฒิการศึกษาตรงตามระดับที่ JD กำหนดหรือไม่
     → ถ้า JD Require ปริญญาโท/เอก และผู้สมัครมีต่ำกว่า ให้ระบุว่าไม่เหมาะสมทันที
     → หาก JD Require สาขาเฉพาะ และผู้สมัครจบสาขาอื่น ให้ระบุว่าไม่เหมาะสมทันที ยกเว้นมีประสบการณ์หรือใบรับรองที่ชดเชยได้
     → หาก JD Require มัธยมปลาย/ปวช./ปวส.:
        - วุฒิเท่ากันหรือสูงกว่า = ผ่านเกณฑ์ทันที
        - หากสูงกว่า (ปริญญาตรีขึ้นไป) = ผ่านเกณฑ์ แต่ให้แนะนำว่าวุฒิสูงเกินตำแหน่ง ควรหางานที่ตรงสายและระดับวุฒิมากกว่านี้เพื่อโอกาสและค่าตอบแทนที่ดีกว่า
        - วุฒิต่ำกว่าที่กำหนด = ไม่เหมาะสมทันที
   - สาขาวิชาตรงกับที่ JD ระบุหรือไม่
   - ทักษะ Hard Skills ที่ JD Require มีครบหรือไม่
     → แยกเป็น "มีและตรง", "มีบางส่วน", "ขาด"
   - ทักษะ Soft Skills ที่ JD คาดหวังมีหรือไม่
   - มีคำคุณศัพท์ลอยๆ ไม่มีหลักฐานหรือไม่
   - มี Certifications / การอบรมที่เกี่ยวข้องหรือไม่

ตอบตาม FORMAT นี้เท่านั้น:

[RELEVANCE]
🔍 ประเมิน: (สรุปว่าเรซูเม่ตรงกับตำแหน่งมากน้อยแค่ไหน รวมถึงอายุ เพศ ข้อมูลติดต่อ และ Career Summary)
✅ จุดแข็ง: (สิ่งที่มีและตรงกับตำแหน่งนี้ดีแล้ว ส่วนอายุ เพศ ข้อมูลติดต่อ ครบถ้วนไม่ถือว่าเป็นจุดแข็ง แต่ถ้ามี Career Summary ที่ดีและตอบโจทย์ถือเป็นจุดแข็ง)
⚠️ สิ่งที่ขาดหรือควรปรับ: (ข้อมูลหรือส่วนที่ไม่มีแต่ควรมี หรือมีแต่ไม่ควรมี รวมถึงอายุ/เพศที่ไม่ตรง JD ถ้ามี)

[EXPERIENCE]
🔍 ประเมิน: (สรุปจำนวนปีประสบการณ์รวมและความสอดคล้องกับที่ JD กำหนด)
❌ ข้อกำหนดที่ไม่ผ่าน: (ระบุถ้าประสบการณ์ไม่ถึงเกณฑ์ที่ JD กำหนด เช่น "JD ต้องการ 3 ปี แต่ผู้สมัครไม่มีประสบการณ์ → ไม่เหมาะสมกับตำแหน่งนี้")
✅ จุดแข็ง: (ประสบการณ์ที่ตรงและน่าประทับใจ ถ้ามี
  — หาก JD รับ Fresh Graduate แต่ผู้สมัครมีประสบการณ์ ให้ระบุว่าผ่านเกณฑ์ทันที
    และแนะนำว่า "ประสบการณ์ที่มีสูงกว่าที่ตำแหน่งนี้ต้องการ ควรพิจารณาสมัครงานที่ Require ประสบการณ์มากกว่านี้เพื่อโอกาสเติบโตและค่าตอบแทนที่เหมาะสมกว่า")
⚠️ ควรปรับปรุง: (ระบุว่าขาดอะไร เช่น ไม่มีตัวเลขผลงาน หน้าที่กว้างเกินไป ไม่ใช้ Active Words)
ตัวอย่างการเขียนที่ดีกว่า:
- (เช่น เปลี่ยนจาก "ดูแลงานขาย" → "บริหารทีมขาย 5 คน เพิ่มยอดขาย 25% ภายใน 6 เดือน")
- (ตัวอย่างที่ 2 ถ้ามี)

[SKILLS]
🎓 วุฒิการศึกษา:
- JD กำหนด: (ระดับและสาขาที่ JD ต้องการ)
- ผู้สมัครมี: (ระดับและสาขาของผู้สมัคร)
- ผล: (เลือกหนึ่งในนี้)
  ✅ ผ่านเกณฑ์ — วุฒิตรงตามที่ JD กำหนด
  ✅ ผ่านเกณฑ์ — วุฒิสูงกว่าที่ JD กำหนด อย่างไรก็ตาม ตำแหน่งนี้ต้องการเพียง [ระดับที่ JD กำหนด] ซึ่งต่ำกว่าวุฒิของผู้สมัคร ควรพิจารณาสมัครงานในระดับที่สูงขึ้นหรือตรงสายวิชามากกว่านี้ เพื่อโอกาสเติบโตในอาชีพและค่าตอบแทนที่เหมาะสมกว่า
  ❌ ไม่เหมาะสม — ระบุเหตุผล เช่น "JD ต้องการปริญญาโท แต่ผู้สมัครมีเพียงปริญญาตรี"

สาขาวิชาหรือความรู้เชิงวิชาการที่ตำแหน่งนี้คาดหวัง: (ระบุ)

🛠️ Hard Skills ที่ JD ต้องการ:
- มีและตรง: (รายการ)
- มีบางส่วน: (รายการ)
- ขาด: (รายการพร้อมเหตุผลว่าสำคัญแค่ไหน)

🤝 Soft Skills ที่ JD คาดหวัง:
- มี: (รายการ)
- ขาด: (รายการ)

สิ่งที่ควรแก้ไขในส่วนทักษะ: (เช่น มีคำคุณศัพท์ลอยๆ ควรเพิ่มหลักฐาน)"""

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
            max_tokens=1200,
        )

        result = response.choices[0].message.content

        relevance_match = re.search(r"\[RELEVANCE\]\s*(.*?)\s*\[EXPERIENCE\]", result, re.S)
        exp_match       = re.search(r"\[EXPERIENCE\]\s*(.*?)\s*\[SKILLS\]", result, re.S)
        skills_match    = re.search(r"\[SKILLS\]\s*(.*)", result, re.S)

        return {
            "relevance":  relevance_match.group(1) if relevance_match else "",
            "experience": exp_match.group(1)       if exp_match       else "",
            "skills":     skills_match.group(1) + "\n"    if skills_match    else "",
        }

    except Exception as e:
        print("MATCH ERROR:", e)
        return JSONResponse({"error": str(e)}, status_code=500)