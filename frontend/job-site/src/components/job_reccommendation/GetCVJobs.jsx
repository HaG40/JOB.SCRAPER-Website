import { useContext,useEffect,useState } from "react";
import { UserContext } from "../../App";
import GetRecommendJob from "./GetRecomendJob";

function SendCVToPython() {
  const { user } = useContext(UserContext);
  const [cVRecommendations, setCVRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (user && user.cv){

            sendCV();
                    
        console.log(cVRecommendations)
        }

    }, []);

  const sendCV = async () => {
    setIsLoading(true)
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
      setCVRecommendations(data.jobs);
    } catch (err) {
      console.error("❌ ส่ง PDF ไม่สำเร็จ:", err);
    }finally{
        setIsLoading(false)
    }
  };

  return (
    <>
      {!isLoading && cVRecommendations.length > 0 ? 
      <>
        {cVRecommendations.length > 0 && !isLoading && cVRecommendations.length > 0 && (
          <GetRecommendJob recommend = {cVRecommendations}/>
        )}
      </>
      :
      <>
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-orange-400" />
          <p className="text-sm text-gray-400">กำลังวิเคราะห์...</p>
        </div>
      </>
      }

    </>  
  )
}

export default SendCVToPython;
