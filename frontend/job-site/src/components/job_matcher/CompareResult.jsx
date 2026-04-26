import { useState, useEffect, useContext, useRef } from "react";
import { JobCompareContext1 } from "./JobMatcher";
import { UserContext } from "../../App";

export default function CompareResult() {
  const { jobBox1, detail } = useContext(JobCompareContext1);
  const { user } = useContext(UserContext);

  const [mScore, setMScore] = useState(0);
  const [reason, setReason] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const reasonRef = useRef(null);
  const adviceRef = useRef(null);

  const hasJob = jobBox1 && Object.keys(jobBox1).length > 0;

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    autoResize(reasonRef.current);
  }, [reason]);

  useEffect(() => {
    autoResize(adviceRef.current);
  }, [advice]);

  // แปลง base64 resume -> File
  const base64ToFile = (base64, filename) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    return new File([blob], filename, { type: "application/pdf" });
  };

  useEffect(() => {
    if (!hasJob) return;
    if (!detail) return;
    if (!user?.cv) return;

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

      const res = await fetch("http://localhost:5000/match", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setMScore(data.score);
      setReason(data.reason);
      setAdvice(data.advice);

    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-2 mb-7 space-y-2 bg-white flex flex-col">
      <div className="flex flex-row justify-between px-4">
        <label className="text-orange-600">คะแนนความเหมาะสม :</label>
        <label>{loading ? "กำลังวิเคราะห์..." : `${mScore} %`}</label>
      </div>

      <div className="px-4">
        <p className="text-orange-600 mb-2">เหตุผล :</p>
        <textarea
          ref={reasonRef}
          className="border rounded-xl text-gray-500 border-gray-200 shadow p-4 resize-none w-full overflow-hidden"
          readOnly
          value={loading ? "กำลังวิเคราะห์..." : reason}
        />
      </div>

      <div className="px-4">
        <p className="text-orange-600 mb-2">คำแนะนำ :</p>
        <textarea
          ref={adviceRef}
          className="border rounded-xl text-gray-500 border-gray-200 shadow p-4 resize-none w-full overflow-hidden"
          readOnly
          value={loading ? "กำลังวิเคราะห์..." : advice}
        />
      </div>
    </div>
  );
}