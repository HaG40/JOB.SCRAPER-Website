import { useState, useEffect, useContext, useRef } from "react";
import { JobCompareContext1 } from "./JobMatcher";
import { UserContext } from "../../App";

const LOADING_TEXT = "กำลังวิเคราะห์...";

const initialState = {
  relevance:  "",
  experience: "",
  skills:     "",
  summary:    "",
};

const DETAIL_FIELDS = [
  { key: "relevance",  label: "🎯 ความตรงกับตำแหน่ง" },
  { key: "experience", label: "💼 ประสบการณ์ทำงาน" },
  { key: "skills",     label: "🛠️ ทักษะและการศึกษา" },
  { key: "summary",    label: "📋 ผลสรุป" },
];

// ── Glossary (เรียงยาว→สั้น เพื่อ match ก่อน) ─────────────────────
const GLOSSARY = {
  "Career Summary/Objective": "สรุปย่อประวัติและเป้าหมายอาชีพ 2-3 บรรทัด ตอบคำถาม 'ทำไมบริษัทถึงควรจ้างคุณ?' วางไว้ต้นเรซูเม่",
  "Reverse Chronological":    "เรียงประสบการณ์จากล่าสุดไปเก่าสุด รูปแบบที่ HR นิยมและ ATS อ่านได้ดีที่สุด",
  "Career Summary":           "สรุปย่อประวัติและเป้าหมาย 2-3 บรรทัด ตอบว่า 'ทำไมบริษัทถึงควรจ้างคุณ?' วางไว้ต้นเรซูเม่",
  "Career Objective":         "ระบุเป้าหมายในอาชีพ เหมาะสำหรับผู้เพิ่งจบหรือเปลี่ยนสายงาน วางไว้ต้นเรซูเม่",
  "Certifications":           "ใบรับรองจากองค์กรที่ได้รับการยอมรับ ยืนยันความสามารถเฉพาะด้านของผู้สมัคร",
  "Active Words":             "คำกริยาแสดงการกระทำและความสำเร็จ เช่น Developed, Managed, Achieved ทำให้ประสบการณ์ดูมีพลัง",
  "ATS":                      "Applicant Tracking System — ระบบที่บริษัทใช้คัดกรองเรซูเม่อัตโนมัติก่อนถึงมือ HR",
};

function GlossaryTooltip({ term, definition }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleMouseEnter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setVisible(true);
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        className="text-blue-600 font-medium cursor-help
                   hover:underline underline-offset-2"
      >
        {term}
      </span>

      {visible && (
        <div
          style={{
            position:  "fixed",
            left:      pos.x,
            top:       pos.y,
            transform: "translate(-50%, -100%)",
            zIndex:    9999,
            pointerEvents: "none",
          }}
          className="bg-orange-600 text-white text-[11px] font-normal
                     leading-relaxed px-3 py-1.5 rounded-lg shadow-lg
                     max-w-[260px] w-max whitespace-normal"
        >
          {definition}
        </div>
      )}
    </>
  );
}

// ── parseWithGlossary: แยก text → React elements ─────────────────
function parseWithGlossary(html) {
  const terms    = Object.keys(GLOSSARY);
  const patterns = terms.map((t) => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return /^[\w]+$/.test(t) ? `\\b${esc}\\b` : esc;
  });
  const combined = new RegExp(`(${patterns.join("|")})`, "g");

  // แยก HTML tags ออก แล้วประมวลผลเฉพาะ text node
  const segments = html.split(/(<[^>]+>|<br\s*\/?>)/);

  return segments.flatMap((seg, si) => {
    // HTML tag → คืนเป็น string ให้ dangerouslySetInnerHTML จัดการ
    if (seg.startsWith("<")) return [{ type: "html", val: seg, key: `h${si}` }];

    // ไม่มี glossary term
    if (!combined.test(seg)) {
      combined.lastIndex = 0;
      return [{ type: "html", val: seg, key: `t${si}` }];
    }
    combined.lastIndex = 0;

    // มี glossary term → แยกและ wrap
    return seg.split(combined).map((part, pi) =>
      GLOSSARY[part]
        ? { type: "gl", term: part, def: GLOSSARY[part], key: `g${si}-${pi}` }
        : { type: "html", val: part, key: `p${si}-${pi}` }
    );
  });
}

// ── formatAIText (เดิม ไม่เปลี่ยน) ──────────────────────────────
function formatAIText(raw = "") {
  if (!raw) return "";
  let text = raw.trim();
  text = text.replace(/^\*\*\s*/, "");
  text = text.replace(/\s*###\s*\*\*\s*$/, "");
  text = text.replace(/###\s*$/, "");
  text = text.replace(/\*\*(.*?)\*\*/g, `<span class="font-bold">$1</span>`);
  text = text.replace(/\*/g, "");
  text = text.replace(/\n/g, "<br/>");
  return text;
}

// ── DetailField ───────────────────────────────────────────────────
function DetailField({ label, value, loading }) {
  const parsed = !loading && value ? parseWithGlossary(formatAIText(value)) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-orange-500">{label}</p>

      <div className="w-full rounded-xl border border-gray-100
                      bg-gray-50 px-4 py-3 text-sm text-gray-700 leading-relaxed
                      shadow-sm whitespace-normal">
        {loading && (
          <div className="flex justify-start items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2
                            border-gray-200 border-t-orange-400 mt-1 shrink-0" />
            <span>{LOADING_TEXT}</span>
          </div>
        )}

        {!loading && parsed && (
          <div>
            {parsed.map((seg) =>
              seg.type === "gl" ? (
                <GlossaryTooltip key={seg.key} term={seg.term} definition={seg.def} />
              ) : (
                <span key={seg.key} dangerouslySetInnerHTML={{ __html: seg.val }} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result (เดิม ไม่เปลี่ยนเลย) ──────────────────────────────────
export default function Result() {
  const { jobBox1, detail } = useContext(JobCompareContext1);
  const { user }            = useContext(UserContext);

  const [result, setResult]           = useState(initialState);
  const [loading, setLoading]         = useState(false);

  const hasJob  = jobBox1 && Object.keys(jobBox1).length > 0;
  const isReady = hasJob && detail;

  const base64ToFile = (base64, filename) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new File([bytes], filename, { type: "application/pdf" });
  };

  useEffect(() => {
    if (!isReady) {
      setResult(initialState);
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !user?.cv) return;
    matchResumeWithJob();
  }, [detail, jobBox1]);

  const matchResumeWithJob = async () => {
    setResult({});
    try {
      setLoading(true);
      const file     = base64ToFile(user.cv, "resume.pdf");
      const formData = new FormData();
      formData.append("resume_file", file);
      formData.append("job_title", jobBox1.title);
      formData.append("job_detail", detail);

      const res  = await fetch("http://localhost:5000/match", { method: "POST", body: formData });
      const data = await res.json();

      setResult({
        relevance:  data.relevance  ?? "",
        experience: data.experience ?? "",
        skills:     data.skills     ?? "",
        summary:    data.summary    ?? "",
      });
    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!hasJob) {
    return (
      <div className="px-4 pb-8 pt-4 bg-white">
        <div className="rounded-2xl border border-dashed border-gray-200
                        bg-gray-50 flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">📋</span>
          <p className="text-sm font-medium text-gray-400">ยังไม่ได้เลือกงาน</p>
          <p className="text-xs text-gray-300 text-center">
            เลือกงานเพื่อเริ่มวิเคราะห์ความเหมาะสมกับ CV ของคุณ
          </p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 pb-8 pt-4 bg-white">
        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white
                        flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2
                          border-gray-200 border-t-orange-400" />
          <p className="text-sm text-gray-400">กำลังโหลดรายละเอียดงาน...</p>
          <p className="text-xs text-gray-300">รอสักครู่ก่อนเริ่มวิเคราะห์</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto flex-1 max-h-[76.6vh] px-4 pb-8 pt-4 space-y-4
                      scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {DETAIL_FIELDS.map(({ key, label }) => (
          <DetailField
            key={key}
            label={label}
            value={result[key]}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}