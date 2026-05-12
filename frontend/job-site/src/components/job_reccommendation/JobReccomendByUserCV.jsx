import { useContext } from "react";
import { AuthContext, UserContext } from "../../App";
import GetCVJobs from "./GetCVJobs";
import React from "react";

function JobReccomendByUserCV() {
  const { user } = useContext(UserContext);
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated || !user) {
    return (
      <div className="w-md flex flex-col items-center justify-center py-16 gap-3 px-4">
        <span className="text-4xl">🔒</span>
        <p className="text-sm font-medium text-gray-500">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
        <p className="text-xs text-gray-400 text-center">
          ฟีเจอร์แนะนำงานสำหรับผู้ใช้ที่ล็อกอินแล้วเท่านั้น
        </p>
      </div>
    );
  }

  
  return (
    <div className="p-2 w-md">
      <h1 className="text-lg font-bold mb-4 text-orange-500">งานที่เหมาะกับคุณ (วิเคราะห์จากเรซูเม่)</h1>

      
      {user.cv ? 
          user && <GetCVJobs/>
        :
          <p className="text-gray-500 ml-2">ไม่มีข้อมูล กรุณาอัปโหลดเรซูเม่</p>
      }
      
    </div>
  );
}

export default JobReccomendByUserCV;
