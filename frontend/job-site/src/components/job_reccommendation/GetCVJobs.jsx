import { useContext, useState } from "react";
import { UserContext } from "../../App";
import GetRecommendJob from "./GetRecomendJob";
import { AI_API } from "../../utils/api";

function SendCVToPython() {
  const { user }              = useContext(UserContext);
  const [recommendations, setRecommendations] = useState([]);

  // ✅ ไม่มี isLoading / error state ที่จะทำให้ GetRecommendJob unmount
  const sendCV = async () => {
    try {
      const bytes    = Uint8Array.from(atob(user.cv), (c) => c.charCodeAt(0));
      const blob     = new Blob([bytes], { type: "application/pdf" });
      const formData = new FormData();
      formData.append("resume_file", blob, "cv.pdf");

      const res = await fetch(`${AI_API}/recommend/cv`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data  = await res.json();
      const jobs  = Array.isArray(data.jobs) ? data.jobs : [];
      setRecommendations(jobs);
      return jobs; // ✅ return กลับให้ GetRecommendJob ใช้ต่อได้เลย
    } catch (err) {
      console.error("ส่ง CV ไม่สำเร็จ:", err);
      return [];
    }
  };

  // ✅ render GetRecommendJob เสมอ ไม่มี conditional ที่ทำให้ unmount
  return (
    <GetRecommendJob
      recommend={recommendations}
      onAnalyzeAccount={sendCV}
    />
  );
}

export default SendCVToPython;