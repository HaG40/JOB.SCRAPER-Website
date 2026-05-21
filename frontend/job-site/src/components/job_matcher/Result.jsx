import { useState, useEffect, useContext, useRef } from "react";
import { JobCompareContext1 } from "./JobMatcher";
import { UserContext } from "../../App";
import { AI_API } from "../../utils/api";

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

const GLOSSARY = {
  "Career Summary/Objective": "สรุปย่อประวัติและเป้าหมายอาชีพ 2-3 บรรทัด ตอบคำถาม 'ทำไมบริษัทถึงควรจ้างคุณ?' วางไว้ต้นเรซูเม่",
  "Reverse Chronological":    "เรียงประสบการณ์จากล่าสุดไปเก่าสุด รูปแบบที่ HR นิยมและ ATS อ่านได้ดีที่สุด",
  "Career Summary":           "สรุปย่อประวัติและเป้าหมาย 2-3 บรรทัด ตอบว่า 'ทำไมบริษัทถึงควรจ้างคุณ?'",
  "Career Objective":         "ระบุเป้าหมายในอาชีพ เหมาะสำหรับผู้เพิ่งจบหรือเปลี่ยนสายงาน",
  "Certifications":           "ใบรับรองจากองค์กรที่ได้รับการยอมรับ ยืนยันความสามารถเฉพาะด้านของผู้สมัคร",
  "Active Words":             "คำกริยาแสดงการกระทำและความสำเร็จ เช่น Developed, Managed, Achieved ทำให้ประสบการณ์ดูมีพลัง",
  "ATS":                      "Applicant Tracking System — ระบบที่บริษัทใช้คัดกรองเรซูเม่อัตโนมัติก่อนถึงมือ HR",
};

// ── GlossaryTooltip ───────────────────────────────────────────────
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
        className="text-blue-500 font-medium cursor-help hover:underline underline-offset-2"
      >
        {term}
      </span>

      {visible && (
        <div
          style={{
            position:      "fixed",
            left:          pos.x,
            top:           pos.y,
            transform:     "translate(-50%, -100%)",
            zIndex:        9999,
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

// ── parseWithGlossary ─────────────────────────────────────────────
function parseWithGlossary(html) {
  const terms    = Object.keys(GLOSSARY);
  const patterns = terms.map((t) => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return /^[\w]+$/.test(t) ? `\\b${esc}\\b` : esc;
  });
  const combined = new RegExp(`(${patterns.join("|")})`, "g");

  const segments = html.split(/(<[^>]+>|<br\s*\/?>)/);

  return segments.flatMap((seg, si) => {
    if (seg.startsWith("<")) return [{ type: "html", val: seg, key: `h${si}` }];
    if (!combined.test(seg)) {
      combined.lastIndex = 0;
      return [{ type: "html", val: seg, key: `t${si}` }];
    }
    combined.lastIndex = 0;
    return seg.split(combined).map((part, pi) =>
      GLOSSARY[part]
        ? { type: "gl", term: part, def: GLOSSARY[part], key: `g${si}-${pi}` }
        : { type: "html", val: part, key: `p${si}-${pi}` }
    );
  });
}

// ── formatAIText ──────────────────────────────────────────────────
function formatAIText(raw = "") {
  if (!raw) return "";
  let text = raw.trim();
  text = text.replace(/^\*\*\s*/, "");
  text = text.replace(/\s*###\s*\*\*\s*$/, "");
  text = text.replace(/\s*##\s*$/, "");
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

// ── Result ────────────────────────────────────────────────────────
export default function Result() {
  const { jobBox1, detail, uploadedCV } = useContext(JobCompareContext1);
  const { user }                        = useContext(UserContext);

  const [result, setResult]   = useState(initialState);
  const [loading, setLoading] = useState(false);

  const [firstLoad, setFirstLoad] = useState(true); // ✅ state เพื่อติดตามการโหลดครั้งแรก

  const hasJob  = jobBox1 && Object.keys(jobBox1).length > 0;
  const isReady = hasJob && !!detail;

  // ✅ มี CV ถ้ามี uploadedCV หรือ user.cv อย่างใดอย่างหนึ่ง
  const hasCV = !!uploadedCV || !!user?.cv;

  useEffect(() => {
    if (!isReady) {
      setResult(initialState);
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !hasCV) return;
    matchResumeWithJob();
  }, [detail]); // ✅ trigger ใหม่เมื่อ uploadedCV เปลี่ยน

  const matchResumeWithJob = async () => {
    if (result && Object.keys(result).length > 0) return; 
    setResult({}); // ✅ รีเซ็ตผลลัพธ์ก่อนโหลดใหม่
    try {
      setLoading(true);

      let file;
      if (uploadedCV) {
        // ✅ ใช้ไฟล์ที่ upload ใหม่ก่อน
        file = uploadedCV;
      } else if (user?.cv) {
        // ✅ fallback ใช้ CV ในบัญชี
        const bytes = Uint8Array.from(atob(user.cv), (c) => c.charCodeAt(0));
        file = new File([bytes], "resume.pdf", { type: "application/pdf" });
      } else {
        return;
      }

      const formData = new FormData();
      formData.append("resume_file", file);
      formData.append("job_title", jobBox1.title);
      formData.append("job_detail", detail);

      const res  = await fetch(`${AI_API}/match`, { method: "POST", body: formData });
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
      setFirstLoad(false); // ✅ หลังจากโหลดครั้งแรกแล้ว ให้ตั้งเป็น false
    }
  };

  // ── Empty state ────────────────────────────────────────────────
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

  // ── ไม่มี CV เลย ───────────────────────────────────────────────
  if (!hasCV) {
    return (
      <div className="px-4 pb-8 pt-4 bg-white">
        <div className="rounded-2xl border border-dashed border-gray-200
                        bg-gray-50 flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">📄</span>
          <p className="text-sm font-medium text-gray-400">ยังไม่มีเรซูเม่</p>
          <p className="text-xs text-gray-300 text-center">
            อัปโหลด CV หรือเพิ่มเรซูเม่ในบัญชีก่อนเริ่มวิเคราะห์
          </p>
        </div>
      </div>
    );
  }

  // ── Loading detail ─────────────────────────────────────────────
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

  // ── Result ─────────────────────────────────────────────────────
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
