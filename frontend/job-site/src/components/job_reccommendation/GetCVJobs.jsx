import { useContext, useState } from "react";
import { UserContext } from "../../App";
import GetRecommendJob from "./GetRecomendJob";

function SendCVToPython() {
  const { user } = useContext(UserContext);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState(null);

  const sendCV = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bytes    = Uint8Array.from(atob(user.cv), (c) => c.charCodeAt(0));
      const blob     = new Blob([bytes], { type: "application/pdf" });
      const formData = new FormData();
      formData.append("resume_file", blob, "cv.pdf");

      const res = await fetch("http://localhost:5000/recommend/cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setRecommendations(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      console.error("ส่ง CV ไม่สำเร็จ:", err);
      setError("เกิดข้อผิดพลาดในการวิเคราะห์ CV");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-orange-400" />
        <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-10 gap-3">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={sendCV}
          className="text-xs text-orange-400 hover:text-orange-500 underline transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <GetRecommendJob
      recommend={recommendations}
      onAnalyzeAccount={sendCV}
    />
  );
}

export default SendCVToPython;