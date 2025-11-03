import { useContext } from "react";
import { AuthContext, UserContext } from "../../App";
import GetPreferenceJobs from "./GetPreferenceJobs";
import React from "react";

function JobReccomendByUserPreferences() {
  const { user } = useContext(UserContext);
  const { isAuthenticated } = useContext(AuthContext);

  return (
    
    <div className="p-2 w-sm                                                                                                                                                                                                         ">
      <h1 className="text-lg font-bold mb-4 text-orange-500">งานที่คุณอาจจะสนใจ</h1>

      {isAuthenticated && user ? 
        user.interested_job ?
          user && <GetPreferenceJobs/>
        :
          <p className="text-gray-500 ml-2">ไม่มีข้อมูล กรุณาป้อนข้อมูลงานที่สนใจ</p>        
      :
        <>
          <p className="text-gray-500 ml-2">ไม่มีข้อมูล กรุณาเข้าสู่ระบบ</p>
        </>
      }

    </div>
  );
}

export default JobReccomendByUserPreferences;
