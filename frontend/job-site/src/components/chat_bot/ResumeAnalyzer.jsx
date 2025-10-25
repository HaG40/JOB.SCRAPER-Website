import React, { useState, useContext } from "react";
import { ChatContext } from "./ChatContext";

function ResumeAnalyzer({ onClose }) {
  const { setMessages } = useContext(ChatContext);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeFile) {
      alert("กรุณาอัปโหลด Resume");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume_file", resumeFile);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analyze API Error");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "✅ ส่งไฟล์สำเร็จ" },
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
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-bold mb-4">📂 Resume Analyzer</h2>
        <div className="flex flex-row justify-between">
          <div className="flex flex-row">
            <input
              id="resume-upload"
              type="file"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="hidden"
            />
            <label
              htmlFor="resume-upload"
              className="bg-orange-400 text-white px-4 py-2 w-fit rounded-lg cursor-pointer hover:bg-orange-500"
            >
              อัปโหลดไฟล์
            </label>
            
            {resumeFile && <span className="ml-2 self-center text-blue-500 font-bold">{resumeFile.name}</span>}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 w-fit bg-orange-400 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 cursor-pointer justify-end"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
