import { useContext } from "react";
import { AuthContext, UserContext } from "../../App";
import GetCVJobs from "./GetCVJobs";
import React from "react";

function JobReccomendByUserCV() {
  const { user } = useContext(UserContext);
  const { isAuthenticated } = useContext(AuthContext);
  
  return (
    <div className="p-2 w-sm">
      <h1 className="text-lg font-bold mb-4 text-orange-500">งานที่เหมาะกับคุณ (วิเคราะห์จากเรซูเม่)</h1>

      {isAuthenticated && user? 
        user.cv ? 
          user && <GetCVJobs/>
        :
          <p className="text-gray-500 ml-2">ไม่มีข้อมูล กรุณาอัปโหลดเรซูเม่</p>
      :
        <>
          <p className="text-gray-500 ml-2">ไม่มีข้อมูล กรุณาเข้าสู่ระบบ</p>
        </>
      }
      
    </div>
  );
}

export default JobReccomendByUserCV;
