# main.py

from fastapi import FastAPI, File, Response, UploadFile, Form, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
from PIL import Image
from pdf2image import convert_from_bytes
from pydantic import BaseModel
from io import BytesIO

import pytesseract
import os
import re
import base64

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://job-scraper-frontend-fawn.vercel.app",
        "https://job-scraper-frontend-fawn.vercel.app/",
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

# =========================
# HELPERS
# =========================

def extract_text(uploaded_file) -> str:
    try:
        filename = uploaded_file.filename.lower()
        uploaded_file.file.seek(0)
        content = uploaded_file.file.read()

        if filename.endswith(".pdf"):
            images = convert_from_bytes(content)
            text = ""
            for img in images:
                text += pytesseract.image_to_string(img, lang="eng+tha") + "\n"
            return text.strip()

        elif filename.endswith((".png", ".jpg", ".jpeg")):
            image = Image.open(BytesIO(content))
            text = pytesseract.image_to_string(image, lang="eng+tha")
            return text.strip()

        return "Unsupported file format"

    except Exception as e:
        return f"Error extracting text: {str(e)}"


def extract_scores(text: str):
    pattern = r'(\d+(?:\.\d+)?)%'
    matches = re.findall(pattern, text)
    return [float(m) for m in matches]


def file_to_base64(file: UploadFile) -> str:
    content_type = file.content_type
    file.file.seek(0)
    file_bytes = file.file.read()

    if content_type == "application/pdf":
        images = convert_from_bytes(file_bytes)
        img = images[0]
        buffer = BytesIO()
        img.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    elif content_type in ["image/jpeg", "image/jpg", "image/png"]:
        return base64.b64encode(file_bytes).decode("utf-8")

    raise ValueError("ไฟล์ต้องเป็น PDF, JPG หรือ PNG เท่านั้น")


class ChatRequest(BaseModel):
    message: str

# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {"status": "ok"}

# =========================
# RECOMMEND JOB BY CV
# =========================

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
ตัวอย่างรูปแบบ: Data Analyst,Python Developer,Business Intelligence,Data Engineer,Machine Learning Engineer"""

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
                    {"type": "text", "text": f"{prompt}\n\nResume Text:\n{resume_text}"},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
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

    return JSONResponse({"reply": ",".join(jobs), "jobs": jobs})


# =========================
# MATCH
# =========================

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

        if content_type == "application/pdf":
            images = convert_from_bytes(file_bytes, dpi=300)  # ✅ ลบ poppler_path ออก

        elif content_type in ["image/jpeg", "image/png", "image/jpg"]:
            images = [Image.open(BytesIO(file_bytes))]

        else:
            return JSONResponse(
                {"error": f"Unsupported file type: {content_type}"},
                status_code=400
            )

        images_base64 = []
        for img in images:
            buf = BytesIO()
            img.save(buf, format="JPEG")
            images_base64.append(base64.b64encode(buf.getvalue()).decode())

        system_prompt = """คุณคือที่ปรึกษาด้านเรซูเม่มืออาชีพ วิเคราะห์เรซูเม่เทียบกับ JD ที่ให้มา ให้คำแนะนำเชิงลึกที่ปฏิบัติได้จริง ไม่ให้คะแนน ไม่วิเคราะห์ Format/รูปแบบเอกสาร

=== หลักการเขียนเรซูเม่ที่ดี (Jobsdb Thailand) ===
ควรทำ: แบ่งส่วนชัดเจน (ข้อมูลส่วนตัว/Career Summary/ประสบการณ์/การศึกษา/ทักษะ) | ภาษากระชับตรงประเด็น | Active Words (ถ้าเป็นภาษาอังกฤษ) | ผลงานเป็นตัวเลขวัดได้ | Reverse Chronological | Career Summary 2-3 บรรทัดตอบ "ทำไมจ้างคุณ?" | ระบุ Certifications ที่เกี่ยวข้อง | ตรวจสะกดและข้อมูลติดต่อ

ห้ามทำ: คำคุณศัพท์ลอยไม่มีหลักฐาน | ข้อมูลส่วนตัวไม่จำเป็น (ศาสนา/น้ำหนัก/ส่วนสูง/สถานภาพ ยกเว้นสายการบิน) | เหตุผลลาออก | ข้อมูลเท็จ | อีเมลไม่เป็นทางการ | หน้าที่งานกว้างไม่มีผลงานรองรับ | ข้อมูลซ้ำซ้อนหรือยาวเกิน 3 หน้า | ภาษาพูด/สไตล์โซเชียล

Soft Skills ที่ HR สำคัญ: Communication | Collaboration | Decision Making & Problem Solving | Negotiation | Time Management | Adaptability & Active Learning

=== แนวทางตามสายงาน + เกณฑ์ความเหมาะสมเฉพาะสาย ===

[สายไอที]
ระบุ: Tech Stack + โปรเจกต์พร้อมผลลัพธ์ + Certifications (AWS/Microsoft/Google Cloud)
การแบ่งสาย — JD ระบุสายใด ผู้สมัครต้องมีทักษะตรงสายนั้น:
- Mobile: iOS (Swift/Objective-C) / Android (Kotlin/Java) / Cross-platform (Flutter/React Native)
  → Web Developer ที่ไม่มีประสบการณ์ Mobile = ไม่เหมาะสม
  → React Native Developer สมัคร Flutter = ปรับปรุงเพิ่ม (ทักษะใกล้เคียง)
- Frontend: React / Vue / Angular / HTML/CSS
- Backend: Node.js / Python / Java / Go / PHP
- Fullstack: ต้องมีทั้ง Frontend + Backend
- Data/AI/ML: Python + SQL + ML Framework (TensorFlow/PyTorch) + Data Pipeline
  → Web Dev ที่ไม่มีประสบการณ์ Data = ไม่เหมาะสม
- DevOps/Cloud: Docker / Kubernetes / CI/CD / AWS / Azure / GCP
- Cybersecurity: Penetration Testing / SIEM / Firewall / CEH/CISSP
- Database Admin: SQL/NoSQL + Performance Tuning + Backup/Recovery
→ คนละสายงานชัดเจน = ไม่เหมาะสมทันที

[สายช่าง/วิศวกรรม]
ระบุ: เครื่องมือ + โครงการ + ขนาดงาน + ใบรับรองความปลอดภัย + ใบอนุญาตประกอบวิชาชีพ (กว.)
การแบ่งสาย — คนละสายถือว่าไม่เหมาะสมทันที:
- วิศวกรรมโยธา (Civil): โครงสร้าง / ถนน / สะพาน / AutoCAD / ใบ กว.โยธา
- วิศวกรรมไฟฟ้า (Electrical): ระบบไฟฟ้า / PLC / ใบ กว.ไฟฟ้า
- วิศวกรรมเครื่องกล (Mechanical): ระบบเครื่องจักร / HVAC / SolidWorks / ใบ กว.เครื่องกล
- วิศวกรรมเคมี (Chemical): กระบวนการผลิต / ความปลอดภัยสารเคมี / ISO
- วิศวกรรมคอมพิวเตอร์ (Computer): Hardware + Embedded System + FPGA
  → ไม่ใช่ Software/IT ล้วน → ต้องมีทักษะ Hardware/Embedded
- วิศวกรรมอุตสาหการ (Industrial/IE): Lean / Six Sigma / Production Planning / ERP
- ช่างไฟฟ้า: ระบบไฟฟ้า / ใบอนุญาตช่างไฟฟ้า
  → ช่างไม้ / ช่างประปา / ช่างเชื่อม สมัครงานช่างไฟฟ้า = ไม่เหมาะสมทันที
- ช่างเครื่องกล/ยนต์: เครื่องยนต์ / ระบบส่งกำลัง
- ช่างโยธา/ก่อสร้าง: งานก่อสร้าง / ประมาณราคา / ควบคุมงาน
- ช่างเชื่อม: AWS/TIG/MIG Welding Certification
- ช่างประปา: ระบบท่อ / ใบอนุญาตประปา
→ คนละสายงานชัดเจน = ไม่เหมาะสมทันที

[สายวิทยาศาสตร์]
ระบุ: งานวิจัย + ทักษะห้องแล็บ + ผลงานตีพิมพ์ + ใบรับรอง/ใบอนุญาตที่เกี่ยวข้องกับสาย
การแบ่งสาย — คนละสาขาถือว่าไม่เหมาะสมทันที:
- เคมี (Chemistry): Organic/Inorganic/Analytical Chem + เครื่อง HPLC/GC/MS
- ชีววิทยา (Biology): Cell Biology / Genetics / Microbiology / PCR / Cell Culture
- จุลชีววิทยา (Microbiology): เพาะเชื้อ / Sterility Testing / GMP
- ชีวเคมี (Biochemistry): Protein Analysis / ELISA / Western Blot
- ฟิสิกส์ (Physics): Optics / Semiconductor / Simulation
- ธรณีวิทยา (Geology): GIS / Rock Analysis / Seismic Survey
- พฤกษศาสตร์ (Botany): Plant Taxonomy / Tissue Culture / Herbarium
- สิ่งแวดล้อม (Environmental Science): EIA / Water/Air Quality / ISO 14001
→ เคมีสมัครงานชีววิทยา หรือ ธรณีวิทยาสมัครงานพฤกษศาสตร์ = ไม่เหมาะสมทันที
→ ยกเว้น: สาขาที่ overlap กัน เช่น ชีวเคมี ↔ จุลชีววิทยา = ปรับปรุงเพิ่ม

[สายการแพทย์/สาธารณสุข]
ระบุ: ใบประกอบวิชาชีพ + ประสบการณ์คลินิก + ทักษะเฉพาะทาง
การแบ่งสาย — ใบประกอบวิชาชีพต้องตรงสาย ถ้าไม่มี = ไม่เหมาะสมทันที:
- แพทย์ (MD): ใบประกอบวิชาชีพเวชกรรม + สาขาเฉพาะทาง (ถ้า JD ระบุ)
- พยาบาล (RN): ใบประกอบวิชาชีพพยาบาล
- เภสัชกร: ใบประกอบวิชาชีพเภสัชกรรม
- กายภาพบำบัด: ใบประกอบวิชาชีพกายภาพบำบัด
- เทคนิคการแพทย์: ใบประกอบวิชาชีพเทคนิคการแพทย์
- นักรังสีการแพทย์: ใบประกอบวิชาชีพรังสีเทคนิค
- ทันตแพทย์: ใบประกอบวิชาชีพทันตกรรม
→ พยาบาลสมัครงานเภสัชกร หรือ เทคนิคการแพทย์สมัครงานกายภาพ = ไม่เหมาะสมทันที

[สายกฎหมาย]
ระบุ: ใบอนุญาตทนายความ + ประสบการณ์คดี/สัญญา + สาขากฎหมายที่เชี่ยวชาญ
การแบ่งสาย:
- ทนายความ: ใบอนุญาตทนายความ + ประสบการณ์คดีที่ตรงสาย (แพ่ง/อาญา/แรงงาน/ทรัพย์สินทางปัญญา)
- นิติกร (ภาครัฐ/เอกชน): วุฒิการศึกษานิติศาสตร์ + ร่างสัญญา/กฎระเบียบ
- Compliance/Legal Counsel: กฎหมายธุรกิจ + กฎระเบียบที่เกี่ยวข้องกับอุตสาหกรรม (เช่น PDPA/SEC/BOT)
→ ทนายคดีอาญาสมัครงาน IP Lawyer = ปรับปรุงเพิ่ม (ต้องมีประสบการณ์ IP)
→ ผู้ไม่มีวุฒินิติศาสตร์/ใบอนุญาตสมัครงานที่กำหนด = ไม่เหมาะสมทันที

[สายการเงิน]
ระบุ: ใบรับรอง (CFA/CPA/CISA/FRM) + ประสบการณ์ตรงสาย + เครื่องมือ (Bloomberg/SAP/Excel)
การแบ่งสาย:
- นักวิเคราะห์การเงิน (Financial Analyst): Financial Modeling + Valuation + CFA
- ผู้สอบบัญชี (Auditor/CPA): ใบ CPA + ประสบการณ์ตรวจสอบ
- บริหารความเสี่ยง (Risk): FRM + Basel/IFRS + Stress Testing
- Trader/Investment: CFA/CISA + ประสบการณ์ตลาดทุน
- Corporate Finance: M&A / Capital Structure / Fundraising
→ Auditor สมัครงาน Trader = ไม่เหมาะสม (ทักษะต่างกันมาก)
→ Financial Analyst สมัครงาน Corporate Finance = ปรับปรุงเพิ่ม (ทักษะใกล้เคียง)

[สายครีเอทีฟ/ดีไซน์]
ระบุ: Portfolio + ซอฟต์แวร์ที่ใช้ + ระดับความเชี่ยวชาญ + ประเภทงาน
การแบ่งสาย:
- Graphic Design: Adobe Illustrator/Photoshop + Print/Digital Design
- UX/UI Design: Figma/Sketch + User Research + Prototype + Wireframe
  → Graphic Designer ที่ไม่มีประสบการณ์ UX Research = ปรับปรุงเพิ่ม
- Motion Graphics/Video: After Effects/Premiere Pro + Animation
- Photography/Videography: กล้อง + Post-production + ประเภทงาน (Commercial/Fashion/Event)
- Industrial/Product Design: SolidWorks/Rhino + ต้นแบบผลิตภัณฑ์
→ Graphic Designer สมัครงาน UX/UI = ปรับปรุงเพิ่ม (ถ้ามีทักษะ Prototype/Wireframe)
→ Graphic Designer สมัครงาน Industrial Design = ไม่เหมาะสม (คนละสายงาน)

[สายการตลาด]
ระบุ: ตัวเลข Campaign + ROI + เครื่องมือ (Google Analytics/Meta Ads/SEO) + ประสบการณ์ข้ามทีม
การแบ่งสาย:
- Digital Marketing: SEO/SEM + Google Ads/Meta Ads + Analytics
- Brand Marketing: Brand Strategy + Consumer Insight + ATL/BTL
- Content Marketing: Content Strategy + Copywriting + SEO Content
- CRM/Loyalty: Customer Data + Segmentation + Email Marketing
- Trade Marketing: In-store + Merchandising + Channel Management
→ Digital Marketing สมัครงาน Trade Marketing = ปรับปรุงเพิ่ม (ทักษะต่างกัน)
→ Content Writer สมัครงาน Performance Marketing = ไม่เหมาะสม (ขาดทักษะ Paid Media)

[สายคอนเทนต์]
ระบุ: ตัวเลขผลลัพธ์ (Engagement/Growth Rate/Views) + ประเภทคอนเทนต์ที่ถนัด
การแบ่งสาย:
- Social Media Content: Platform-specific (TikTok/Instagram/YouTube) + Trend Awareness
- Copywriter: Long-form/Short-form + SEO Writing + Brand Voice
- Technical Writer: เอกสารเทคนิค + API Docs + Manual
- Script Writer: บทพูด/บทวิดีโอ + Storytelling
→ Copywriter สมัครงาน Technical Writer = ปรับปรุงเพิ่ม (ต้องมีความรู้เทคนิค)
→ Social Media Content Creator สมัครงาน Technical Writer = ไม่เหมาะสม

[สายภาษา]
ระบุ: ระดับความสามารถแยกทักษะ + ผลสอบ (TOEIC/IELTS/JLPT/HSK) + ประเภทงาน
การแบ่งสาย:
- ล่าม (Interpreter): Simultaneous/Consecutive Interpreting + ความเชี่ยวชาญสาขา (กฎหมาย/การแพทย์/ธุรกิจ)
- นักแปล (Translator): ประเภทเอกสาร (เทคนิค/วรรณกรรม/กฎหมาย/การแพทย์)
- ครูสอนภาษา: วุฒิการศึกษา + ใบรับรองการสอน (TEFL/TESOL/CELTA)
→ นักแปลเอกสารทั่วไปสมัครงานล่ามการแพทย์ = ปรับปรุงเพิ่ม (ต้องมีความรู้การแพทย์)
→ ครูสอนภาษาสมัครงานนักแปลเอกสารกฎหมาย = ไม่เหมาะสม (ขาดทักษะการแปลเฉพาะทาง)

[สายบัญชี]
ระบุ: ซอฟต์แวร์ (SAP/Express/QuickBooks) + ใบรับรอง (CPA/CPD) + มูลค่างบที่ดูแล + ประสบการณ์ภาษี

[สายการบิน]
ระบุ: Soft Skills + ภาษา (TOEIC 550+) + ใบรับรองความปลอดภัย + ส่วนสูง/น้ำหนัก (ระบุในเรซูเม่)

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

ใบประกอบวิชาชีพ/ใบอนุญาต:
- JD Require ใบประกอบวิชาชีพ (แพทย์/พยาบาล/เภสัช/กายภาพ/ทันตแพทย์/ทนายความ/กว.) → ไม่มีใบ = ไม่ผ่านทันที

สายงานไม่ตรง:
- JD ระบุสายงานเฉพาะ (Mobile Dev / ช่างไฟฟ้า / เคมี / ทนายคดีอาญา ฯลฯ) → ผู้สมัครมีทักษะคนละสายชัดเจน = ไม่ผ่านทันที
- ยกเว้น: สายงานที่ overlap หรือทักษะใกล้เคียง → ระบุว่า "ปรับปรุงเพิ่ม" พร้อมเหตุผล

=== เกณฑ์วิเคราะห์ (3 มิติ) ===
1. Job Relevance: ข้อมูลติดต่อ | อายุ/เพศตรง JD | Career Summary ตอบโจทย์ตำแหน่ง | เนื้อหาสอดคล้อง JD | ข้อมูลที่ไม่ควรมี
2. Work Experience: ชื่อตำแหน่ง/บริษัท/ช่วงเวลาชัดเจน | ปีประสบการณ์ตาม JD | ผลงานตัวเลขวัดได้ | Active Words | หน้าที่เฉพาะเจาะจง | Reverse Chronological
3. Skills & Education: วุฒิ/สาขาตาม JD | สายงานตรงตามที่ JD กำหนด | Hard Skills (มีและตรง/มีบางส่วน/ขาด) | Soft Skills | คำคุณศัพท์ลอย | Certifications | ใบประกอบวิชาชีพ (ถ้า JD กำหนด)

=== FORMAT (ตอบตามนี้เท่านั้น) ===

[RELEVANCE]
🔍 ประเมิน: ...
✅ จุดแข็ง: ...
⚠️ สิ่งที่ขาดหรือควรปรับ: ...

[EXPERIENCE]
🔍 ประเมิน: ...
❌ ข้อกำหนดที่ไม่ผ่าน: ...
✅ จุดแข็ง: ...
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
ความเหมาะสม: ✅ ตรงเกณฑ์ / ⚠️ ปรับปรุงเพิ่ม / ❌ ไม่เหมาะสม
📌 เหตุผล: ...
(ไม่ต้องสรุปภาพรวม)"""

        user_prompt = f"""กรุณาประเมินเรซูเม่ต่อไปนี้ตามเกณฑ์โดยเทียบกับรายละเอียดงานที่ให้ไว้

รายละเอียดงาน (Job Description):
ชื่อตำแหน่ง: {job_title}
{job_detail}

เนื้อหาเรซูเม่/CV อยู่ในรูปภาพที่แนบมาด้านล่าง กรุณาอ่านและประเมินตามเกณฑ์ที่กำหนด"""

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    *[
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{img}"}
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
            max_tokens=2500,  # ✅ เพิ่มจาก 2000
        )

        result = response.choices[0].message.content

        relevance_match = re.search(r"\[RELEVANCE\]\s*(.*?)\s*\[EXPERIENCE\]", result, re.S)
        exp_match       = re.search(r"\[EXPERIENCE\]\s*(.*?)\s*\[SKILLS\]",    result, re.S)
        skills_match    = re.search(r"\[SKILLS\]\s*(.*?)\s*\[SUMMARY\]",       result, re.S)
        summary_match   = re.search(r"\[SUMMARY\]\s*(.*)",                      result, re.S)

        return {
            "relevance":  relevance_match.group(1).strip() if relevance_match else "",
            "experience": exp_match.group(1).strip()       if exp_match       else "",
            "skills":     skills_match.group(1).strip()    if skills_match    else "",
            "summary":    summary_match.group(1).strip()   if summary_match   else "",
        }

    except Exception as e:
        print("MATCH ERROR:", e)
        return JSONResponse({"error": str(e)}, status_code=500)