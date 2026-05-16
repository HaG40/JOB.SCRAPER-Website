import { useState, useEffect, useContext, useRef } from "react";
import { JobCompareContext1 } from "./JobMatcher";
import { UserContext } from "../../App";

const LOADING_TEXT = "กำลังวิเคราะห์...";

const initialState = {
  relevance:  "",
  experience: "",
  skills:     "",
  advice:     "",
};

const DETAIL_FIELDS = [
  { key: "relevance",  label: "🎯 ความตรงกับตำแหน่ง" },
  { key: "experience", label: "💼 ประสบการณ์ทำงาน" },
  { key: "skills",     label: "🛠️ ทักษะและการศึกษา" },
  { key: "advice",     label: "💡 คำแนะนำในการปรับปรุง" },
];

function DetailField({ label, value, loading }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-orange-500">{label}</p>
      <textarea
        ref={ref}
        readOnly
        value={loading ? LOADING_TEXT : value}
        className="w-full resize-none overflow-hidden rounded-xl border border-gray-100
                   bg-gray-50 px-4 py-3 text-sm text-gray-600 leading-relaxed
                   shadow-sm focus:outline-none"
      />
    </div>
  );
}

export default function Result() {
  const { jobBox1, detail } = useContext(JobCompareContext1);
  const { user } = useContext(UserContext);

  const [result, setResult] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const hasJob  = jobBox1 && Object.keys(jobBox1).length > 0;
  const isReady = hasJob && !!detail;

  const base64ToFile = (base64, filename) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new File([bytes], filename, { type: "application/pdf" });
  };

  // ✅ reset เมื่อเงื่อนไขไม่ครบ
  useEffect(() => {
    if (!isReady) {
      setResult(initialState);
      setLoading(false);
    }
  }, [isReady]);

  // ✅ fetch เมื่อครบทุกเงื่อนไข
  useEffect(() => {
    if (!isReady || !user?.cv) return;
    matchResumeWithJob();
  }, [detail, jobBox1]);

  const matchResumeWithJob = async () => {
    try {
      setLoading(true);
      const file = base64ToFile(user.cv, "resume.pdf");
      const formData = new FormData();
      formData.append("resume_file", file);
      formData.append("job_title", jobBox1.title);
      formData.append("job_detail", detail);

      const res = await fetch("http://localhost:5000/match", { method: "POST", body: formData });
      const data = await res.json();

      setResult({
        relevance:  data.relevance  ?? "",
        experience: data.experience ?? "",
        skills:     data.skills     ?? "",
        advice:     data.advice     ?? "",
      });
    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Empty state: ไม่มี job ─────────────────────────────────────
  if (!hasJob) {
    return (
      <div className="px-4 pb-8 bg-white">
        <div className="rounded-2xl border border-dashed border-gray-200
                        bg-gray-50 flex flex-col items-center justify-center
                        py-16 gap-3">
          <span className="text-4xl">📋</span>
          <p className="text-sm font-medium text-gray-400">ยังไม่ได้เลือกงาน</p>
          <p className="text-xs text-gray-300 text-center">
            เลือกงานเพื่อเริ่มวิเคราะห์ความเหมาะสมกับ CV ของคุณ
          </p>
        </div>
      </div>
    );
  }

  // ── Loading detail ─────────────────────────────────────────────
  if (!detail) {
    return (
      <div className="px-4 pb-8 bg-white">
        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white
                        flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-orange-400" />
          <p className="text-sm text-gray-400">กำลังโหลดรายละเอียดงาน...</p>
          <p className="text-xs text-gray-300">รอสักครู่ก่อนเริ่มวิเคราะห์</p>
        </div>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────
  return (
    <div className="px-4 pb-8 space-y-4 bg-white">
      {DETAIL_FIELDS.map(({ key, label }) => (
        <DetailField
          key={key}
          label={label}
          value={result[key]}
          loading={loading}
        />
      ))}
    </div>
  );
}