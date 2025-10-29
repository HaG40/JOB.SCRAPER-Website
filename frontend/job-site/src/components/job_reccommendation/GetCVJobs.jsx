import { useContext,useEffect,useState } from "react";
import { UserContext } from "../../App";

function SendCVToPython() {
  const { user } = useContext(UserContext);
  const [cVRecommendations, setCVRecommendations] = useState(null);

    useEffect(() => {
        if (user && user.cv){
            sendCV();
        }
    }, [user.id]);

  const sendCV = async () => {
    try {
      const base64 = user.cv;

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: "application/pdf" });

      const formData = new FormData();
      formData.append("resume_file", pdfBlob, "cv.pdf");

      const res = await fetch("http://localhost:5000/recommend/cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("✅ Response:", data);
      setCVRecommendations(data);
    } catch (err) {
      console.error("❌ ส่ง PDF ไม่สำเร็จ:", err);
    }
  };
}

export default SendCVToPython;
