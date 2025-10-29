import { useContext,useEffect,useState, createContext } from "react";
import { UserContext } from "../../App";

export const CVRecommendContext = createContext();

function SendCVToPython() {
  const { user } = useContext(UserContext);
  const [cVRecommendations, setCVRecommendations] = useState([]);

    useEffect(() => {
        if (user && user.cv){
            sendCV();
                    
        console.log(cVRecommendations)
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
      setCVRecommendations(data.jobs);
    } catch (err) {
      console.error("❌ ส่ง PDF ไม่สำเร็จ:", err);
    }
  };

  return (
    <>
    <CVRecommendContext.Provider value={cVRecommendations}>
      <div className="flex flex-col gap-4"> 
        <button className="shadow bg-orange-600 rounded cursor-pointer py-1 px-2 text-white">{cVRecommendations[0]}</button>
        <button className="shadow bg-orange-600 rounded cursor-pointer py-1 px-2 text-white">{cVRecommendations[1]}</button>
        <button className="shadow bg-orange-600 rounded cursor-pointer py-1 px-2 text-white">{cVRecommendations[2]}</button>
      </div>

    </CVRecommendContext.Provider>
    </>  
  )
}

export default SendCVToPython;
