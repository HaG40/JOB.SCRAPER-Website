import React, { useState, useContext } from "react";
import { ChatContext } from "./ChatContext";

function ResumeAnalyzer({ onClose }) {
  const { setMessages } = useContext(ChatContext);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDesc) {
      alert("กรุณาอัปโหลด Resume และใส่ Job Description");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume_file", resumeFile);
    formData.append("job_desc", jobDesc);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analyze API Error");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.report },
      ]);
      onClose(); // ปิด popup หลังวิเคราะห์เสร็จ
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ วิเคราะห์ไม่สำเร็จ" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4">📂 Resume Analyzer</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setResumeFile(e.target.files[0])}
          className="mb-3"
        />
        <textarea
          rows={4}
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          placeholder="ใส่ Job Description..."
          className="w-full border p-2 rounded-lg mb-3"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "⏳ Analyzing..." : "🚀 Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
