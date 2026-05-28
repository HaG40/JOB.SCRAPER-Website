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
from contextlib import asynccontextmanager

import pytesseract
import numpy as np
import os
import re
import base64

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

pytesseract.pytesseract.tesseract_cmd = r"C:/Program Files/Tesseract-OCR/tesseract.exe"
POPPLER_PATH = r"C:/Program Files/poppler-25.07.0/Library/bin"

EMBED_MODEL = "nomic-embed-text-v1_5"

# =========================
# JOB ROLE CATALOG
# คำอธิบายแต่ละบทบาทควรครอบคลุม skills, tools, context
# เพื่อให้ semantic similarity ทำงานได้ดี
# =========================

JOB_ROLES = {
    # ── IT ──────────────────────────────────────────────────────────────
    "Mobile Developer":
        "iOS Android Flutter React Native Swift Kotlin mobile app development cross-platform UI/UX push notification REST API Firebase",
    "Frontend Developer":
        "React Vue Angular HTML CSS JavaScript TypeScript responsive design UI component Tailwind Bootstrap web interface",
    "Backend Developer":
        "Node.js Python Go Java Spring Django REST API GraphQL database SQL authentication microservices server-side",
    "Full Stack Developer":
        "React Node.js JavaScript TypeScript HTML CSS REST API PostgreSQL MongoDB full stack web frontend backend Git agile",
    "Data Analyst":
        "SQL Python R Excel Tableau Power BI statistics data visualization business intelligence reporting data cleaning pandas pivot table",
    "Data Engineer":
        "ETL pipeline Apache Spark Kafka Airflow AWS GCP BigQuery data warehouse Hadoop Scala Python data infrastructure",
    "Data Scientist / ML Engineer":
        "machine learning deep learning TensorFlow PyTorch scikit-learn Python statistics NLP computer vision model training feature engineering",
    "DevOps / Cloud Engineer":
        "Docker Kubernetes CI/CD Jenkins GitHub Actions AWS Azure GCP Terraform Linux bash infrastructure automation monitoring",
    "Cybersecurity Engineer":
        "penetration testing SIEM firewall network security CEH CISSP vulnerability assessment incident response SOC",
    "Database Administrator":
        "SQL NoSQL PostgreSQL MySQL MongoDB performance tuning backup recovery replication query optimization DBA",
    "QA / Test Engineer":
        "software testing unit test integration test automation Selenium JUnit pytest test plan bug report quality assurance",

    # ── Engineering ──────────────────────────────────────────────────────
    "Civil Engineer":
        "structural design AutoCAD STAAD road bridge construction project management ใบ กว.โยธา site survey",
    "Electrical Engineer":
        "electrical system PLC SCADA wiring diagram power system ใบ กว.ไฟฟ้า control panel maintenance",
    "Mechanical Engineer":
        "machine design SolidWorks AutoCAD HVAC manufacturing maintenance ใบ กว.เครื่องกล CNC production",
    "Industrial / IE Engineer":
        "Lean Six Sigma production planning ERP process improvement kaizen factory layout time study supply chain",
    "Chemical Engineer":
        "process engineering chemical plant safety ISO HAZOP reaction engineering fluid mechanics material balance",

    # ── Science ──────────────────────────────────────────────────────────
    "Chemist / Chemical Analyst":
        "organic chemistry analytical chemistry HPLC GC mass spectrometry laboratory research formulation QC",
    "Biologist / Microbiologist":
        "cell biology PCR microbiology sterility testing cell culture genetics GMP laboratory research",
    "Environmental Scientist":
        "EIA environmental impact assessment water quality air quality ISO 14001 sustainability monitoring",

    # ── Finance / Accounting ──────────────────────────────────────────────
    "Accountant":
        "accounting SAP Express QuickBooks financial report tax CPA CPD audit balance sheet bookkeeping",
    "Financial Analyst":
        "financial modeling valuation DCF Excel Bloomberg CFA investment analysis budget forecasting P&L",
    "Auditor":
        "internal audit external audit CPA risk assessment compliance IFRS financial statement verification",
    "Risk Manager":
        "risk management FRM Basel IFRS stress testing credit risk market risk regulatory compliance",

    # ── Marketing / Content ───────────────────────────────────────────────
    "Digital Marketing":
        "SEO SEM Google Ads Meta Ads Google Analytics performance marketing content strategy social media ROI",
    "Brand Marketing":
        "brand strategy ATL BTL consumer insight campaign management market research creative brief media plan",
    "Content Creator / Copywriter":
        "copywriting content writing SEO blog social media engagement storytelling brand voice script video",
    "Graphic Designer":
        "Adobe Illustrator Photoshop InDesign visual design print digital layout typography branding portfolio",
    "UX/UI Designer":
        "Figma Sketch user research wireframe prototype usability testing user journey interaction design",

    # ── Healthcare / Legal / HR ──────────────────────────────────────────
    "Medical Doctor":
        "ใบประกอบวิชาชีพเวชกรรม clinical diagnosis treatment patient care hospital ward OPD",
    "Nurse":
        "ใบประกอบวิชาชีพพยาบาล patient care ward ICU medication nursing assessment vital signs",
    "Pharmacist":
        "ใบประกอบวิชาชีพเภสัชกรรม drug dispensing pharmacy clinical pharmacology medication counseling",
    "Lawyer / Legal Officer":
        "ใบอนุญาตทนายความ contract drafting legal research litigation compliance corporate law",
    "HR / Recruiter":
        "human resources recruitment talent acquisition payroll performance management HRIS labor law training",
    "Translator / Interpreter":
        "translation interpretation TOEIC IELTS JLPT multilingual document localization proofreading",

    # ── Aviation / Hospitality ────────────────────────────────────────────
    "Flight Attendant / Cabin Crew":
        "airline cabin crew customer service TOEIC safety certificate hospitality communication height weight",
    "Hotel / Hospitality":
        "hotel management front desk food and beverage housekeeping guest service tourism customer experience",
}

# =========================
# Pre-computed job embeddings (ทำครั้งเดียวตอน startup)
# =========================
job_embeddings: dict[str, list[float]] = {}

# =========================
# APP
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-compute job role embeddings ตอน startup"""
    print("⏳ Pre-computing job role embeddings...")
    for role, description in JOB_ROLES.items():
        resp = client.embeddings.create(
            model=EMBED_MODEL,
            input=description,
        )
        job_embeddings[role] = resp.data[0].embedding
    print(f"✅ Embedded {len(job_embeddings)} job roles")
    yield

app = FastAPI(title="AI Resume Analyzer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://job-scraper-frontend-fawn.vercel.app",
        "https://job-scraper-frontend-fawn.vercel.app/",
        "http://localhost:5173",
        "http://localhost:5173/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=API_KEY)

# =========================
# HELPERS
# =========================

def extract_text(uploaded_file) -> str:
    try:
        filename = uploaded_file.filename.lower()
        uploaded_file.file.seek(0)
        content = uploaded_file.file.read()
        if filename.endswith(".pdf"):
            images = convert_from_bytes(content, poppler_path=POPPLER_PATH)
            text = ""
            for img in images:
                text += pytesseract.image_to_string(img, lang="eng+tha") + "\n"
            return text.strip()
        elif filename.endswith((".png", ".jpg", ".jpeg")):
            image = Image.open(BytesIO(content))
            return pytesseract.image_to_string(image, lang="eng+tha").strip()
        return "Unsupported file format"
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def file_to_base64(file: UploadFile) -> str:
    content_type = file.content_type
    file.file.seek(0)
    file_bytes = file.file.read()
    if content_type == "application/pdf":
        images = convert_from_bytes(file_bytes, poppler_path=POPPLER_PATH)
        buf = BytesIO()
        images[0].save(buf, format="JPEG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    elif content_type in ["image/jpeg", "image/jpg", "image/png"]:
        return base64.b64encode(file_bytes).decode("utf-8")
    raise ValueError("ไฟล์ต้องเป็น PDF, JPG หรือ PNG เท่านั้น")


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity ระหว่าง 2 vectors"""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / norm) if norm > 0 else 0.0


def extract_key_sections(resume_text: str, base64_image: str) -> str:
    """
    ใช้ Vision Model สกัด key sections จากเรซูเม่
    → ได้ข้อความที่ focused สำหรับการ embed
    """
    prompt = """จากเรซูเม่/CV ในรูปภาพและข้อความที่ให้มา ให้สกัดเฉพาะส่วนต่อไปนี้:

1. ชื่อตำแหน่งงานปัจจุบัน หรือล่าสุด
2. ทักษะเทคนิค (Technical Skills, Programming Languages, Tools, Frameworks)
3. ชื่อตำแหน่งงานทั้งหมดที่เคยทำ
4. สาขาวิชาที่จบการศึกษา
5. Career Summary หรือ Objective (ถ้ามี)
6. Certifications หรือใบรับรองวิชาชีพ (ถ้ามี)

ตอบในรูปแบบ plain text รวมทุกส่วนเป็นประโยคเดียวกัน ไม่ต้องมี header ไม่ต้องอธิบาย ให้เฉพาะข้อมูลที่สกัดได้เท่านั้น"""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": f"{prompt}\n\nOCR Text:\n{resume_text[:2000]}"},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
            ]
        }],
        temperature=0.1,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


def get_embedding(text: str) -> list[float]:
    """เรียก GROQ Embedding API"""
    response = client.embeddings.create(
        model=EMBED_MODEL,
        input=text[:8000],  # nomic-embed-text รองรับสูงสุด 8192 tokens
    )
    return response.data[0].embedding


def rank_jobs_by_similarity(resume_embedding: list[float], top_k: int = 5) -> list[str]:
    """จัดอันดับ job roles โดย cosine similarity"""
    scores = {
        role: cosine_similarity(resume_embedding, emb)
        for role, emb in job_embeddings.items()
    }
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [role for role, _ in ranked[:top_k]]


class ChatRequest(BaseModel):
    message: str

# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {"status": "ok"}

# =========================
# RECOMMEND JOB BY CV  (Semantic Embedding)
# =========================

@app.post("/recommend/cv")
async def recommend_job_by_cv(resume_file: UploadFile = File(...)):
    try:
        # ── Step 1: OCR ────────────────────────────────────────────────
        resume_file.file.seek(0)
        resume_text = extract_text(resume_file)

        # ── Step 2: Base64 สำหรับ Vision Model ────────────────────────
        resume_file.file.seek(0)
        base64_image = file_to_base64(resume_file)

        # ── Step 3: Vision Model สกัด key sections ────────────────────
        key_sections = extract_key_sections(resume_text, base64_image)

        # ── Step 4: รวม OCR + key sections เพื่อ embed ─────────────────
        # ใช้ key_sections เป็นหลัก + บาง OCR เสริม context
        embed_text = f"{key_sections}\n\n{resume_text[:1000]}"

        # ── Step 5: Semantic Embedding ─────────────────────────────────
        resume_embedding = get_embedding(embed_text)

        # ── Step 6: Cosine Similarity → Top 5 ─────────────────────────
        top_jobs = rank_jobs_by_similarity(resume_embedding, top_k=5)

        return JSONResponse({
            "reply": ",".join(top_jobs),
            "jobs":  top_jobs,
        })

    except Exception as e:
        print("RECOMMEND ERROR:", e)
        return JSONResponse({"error": str(e)}, status_code=500)


# =========================
# MATCH  (ไม่เปลี่ยน)
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
            images = convert_from_bytes(file_bytes, dpi=300, poppler_path=POPPLER_PATH)
        elif content_type in ["image/jpeg", "image/png", "image/jpg"]:
            images = [Image.open(BytesIO(file_bytes))]
        else:
            return JSONResponse({"error": f"Unsupported file type: {content_type}"}, status_code=400)

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
- Mobile: iOS (Swift/Objective-C) / Android (Kotlin/Java) / Cross-platform (Flutter/React Native) → Web Developer ที่ไม่มีประสบการณ์ Mobile = ไม่เหมาะสม | React Native Developer สมัคร Flutter = ควรพิจารณา
- Frontend: React / Vue / Angular / HTML/CSS
- Backend: Node.js / Python / Java / Go / PHP
- Fullstack: ต้องมีทั้ง Frontend + Backend
- Data/AI/ML: Python + SQL + ML Framework (TensorFlow/PyTorch) + Data Pipeline → Web Dev ที่ไม่มีประสบการณ์ Data = ไม่เหมาะสม
- DevOps/Cloud: Docker / Kubernetes / CI/CD / AWS / Azure / GCP
- Cybersecurity: Penetration Testing / SIEM / Firewall / CEH/CISSP
- Database Admin: SQL/NoSQL + Performance Tuning + Backup/Recovery
→ คนละสายงานชัดเจน = ไม่เหมาะสมทันที

[สายช่าง/วิศวกรรม]
ระบุ: เครื่องมือ + โครงการ + ขนาดงาน + ใบรับรองความปลอดภัย + ใบอนุญาตประกอบวิชาชีพ (กว.)
- วิศวกรรมโยธา: โครงสร้าง/ถนน/สะพาน/AutoCAD/ใบ กว.โยธา
- วิศวกรรมไฟฟ้า: ระบบไฟฟ้า/PLC/ใบ กว.ไฟฟ้า
- วิศวกรรมเครื่องกล: HVAC/SolidWorks/ใบ กว.เครื่องกล
- วิศวกรรมคอมพิวเตอร์: Hardware+Embedded System+FPGA → ไม่ใช่ Software/IT ล้วน
- วิศวกรรมอุตสาหการ: Lean/Six Sigma/ERP
→ คนละสายงานชัดเจน = ไม่เหมาะสมทันที

[สายวิทยาศาสตร์]
- เคมี: HPLC/GC/MS | ชีววิทยา: PCR/Cell Culture | จุลชีววิทยา: GMP | ชีวเคมี: ELISA | ฟิสิกส์: Semiconductor | ธรณีวิทยา: GIS | พฤกษศาสตร์: Tissue Culture | สิ่งแวดล้อม: EIA
→ คนละสาขาชัดเจน = ไม่เหมาะสมทันที | ยกเว้น overlap เช่น ชีวเคมี ↔ จุลชีววิทยา = ควรพิจารณา

[สายการแพทย์/สาธารณสุข]
ใบประกอบวิชาชีพต้องตรงสาย ถ้าไม่มี = ไม่เหมาะสมทันที

[สายกฎหมาย]
ใบอนุญาตทนายความ/วุฒินิติศาสตร์ต้องตรงสาย

[สายการเงิน]
- Financial Analyst: CFA | Auditor: CPA | Risk: FRM | Trader: CFA/CISA | Corporate Finance: M&A
→ Auditor สมัคร Trader = ไม่เหมาะสม | Financial Analyst สมัคร Corporate Finance = ควรพิจารณา

[สายครีเอทีฟ/ดีไซน์]
- Graphic: Illustrator/Photoshop | UX/UI: Figma+User Research | Motion: After Effects | Industrial: SolidWorks/Rhino
→ Graphic Designer สมัคร UX/UI = ควรพิจารณา (ถ้ามี Prototype) | สมัคร Industrial Design = ไม่เหมาะสม

[สายการตลาด]
- Digital: SEO/SEM/Analytics | Brand: ATL/BTL | Content: Copywriting | CRM: Segmentation | Trade: In-store
→ Content Writer สมัคร Performance Marketing = ไม่เหมาะสม

[สายคอนเทนต์]
- Social Media/Copywriter/Technical Writer/Script Writer
→ Social Media Creator สมัคร Technical Writer = ไม่เหมาะสม

[สายภาษา]
ล่าม/นักแปล/ครูสอนภาษา + ผลสอบ TOEIC/IELTS/JLPT/HSK

[สายบัญชี] SAP/Express + CPA/CPD + มูลค่าบัญชี + ประสบการณ์ภาษี
[สายการบิน] Soft Skills + TOEIC 550+ + ใบรับรองความปลอดภัย + ส่วนสูง/น้ำหนัก

Career Summary ที่ดี: (1) ตำแหน่ง/ระดับประสบการณ์ (2) ทักษะ/ความสำเร็จที่เกี่ยวข้อง (3) เป้าหมายอาชีพ

=== Hard Disqualifier ===
- JD Require ป.โท → ป.ตรีหรือต่ำกว่า = ไม่ผ่าน
- JD Require ป.เอก → ต่ำกว่า ป.เอก = ไม่ผ่าน
- JD Require สาขาเฉพาะ → จบสาขาอื่น = ไม่ผ่าน (ยกเว้นมีประสบการณ์/ใบรับรองชดเชย)
- JD Require ม.ปลาย/ปวช./ปวส.: วุฒิต่ำกว่า = ไม่ผ่าน | เท่ากัน = ผ่าน | สูงกว่า = ผ่าน แต่แนะนำหางานที่ตรงวุฒิมากกว่า
- JD Require ประสบการณ์ขั้นต่ำ → น้อยกว่า = ไม่ผ่าน
- JD รับ Fresh Graduate: ไม่มีประสบการณ์ = ผ่าน | มีมากกว่า = ผ่าน แต่แนะนำหางานที่ Require สูงกว่า
- JD ระบุอายุ → ไม่ตรง = ไม่ผ่าน | ไม่ระบุอายุแต่ JD กำหนด = แจ้งให้ระบุ
- JD ระบุเพศ → ไม่ตรง = ไม่ผ่าน
- ใบประกอบวิชาชีพ (แพทย์/พยาบาล/เภสัช/กายภาพ/ทันตแพทย์/ทนายความ/กว.) → ไม่มี = ไม่ผ่านทันที
- สายงานต่างกันชัดเจน → ไม่ผ่านทันที | Overlap → ควรพิจารณา

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
ความเหมาะสม: ✅ เหมาะสม / ⚠️ ควรพิจารณา / ❌ ไม่เหมาะสม
📌 เหตุผล: ..."""

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
                    *[{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}} for img in images_base64]
                ]
            }
        ]

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            temperature=0.2,
            max_tokens=2500,
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