import React, { useContext, useEffect, useState } from 'react';
import { AuthContext, UserContext } from '../../App';
import calculateAge from '../../utils/CalculateAge';
import { useLocation } from 'react-router-dom';

function ViewUserPage() {
    const [ targetUser, setTargetUser ] = useState(null)
    const location = useLocation();
    const { destId } = location.state || {};

useEffect(() => {


  const fetchFavorites = async () => {
    try {
      const res = await fetch(`http://localhost:8888/api/user/view?userID=${destId}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      setTargetUser({
        id: data.user_id,
        username: data.username,
        firstName: data.first_name,
        lastName: data.last_name,
        dob: data.date_of_birth,
        age: calculateAge(data.date_of_birth),
        email: data.email,
        description: data.description,
      });
      console.log(data)
    } catch (err) {
      console.error("Failed to fetch target user", err);
    }
  };

  fetchFavorites(); 

}, []);

  if (!targetUser) {
    return <p className="text-center mt-10">กำลังโหลดข้อมูลผู้ใช้...</p>;
  }

  return (
    <>
      <div className='mx-auto max-w-xl flex flex-col'>
            <h1 className='text-2xl font-semibold flex items-center text-orange-600 mt-5'>บัญชีผู้ใช้:</h1>
      </div>
        <div className='mx-auto max-w-xl border rounded-xl p-8 mt-5 mb-8 border-gray-300 flex flex-col shadow'>

          <div className='flex flex-row justify-between mb-5'>
              <h1 className='text-xl text-orange-600 font-medium '>{targetUser.username}</h1>
              </div>
              <br />
              <div className='ml-4 flex flex-col space-y-2'>
                  <label><b>ชื่อ</b> : {targetUser.firstName + " " + targetUser.lastName}</label>
                  <label><b>อายุ</b> : {targetUser.age}</label>
                  <label><b>อีเมลล์</b> : {targetUser.email}</label>
                  <label><b>รายละเอียด</b>: </label>  
                  <div className='text-gray-500 mt-1 mx-4'>                    
                      {targetUser.description === "" 
                      ? <p >ไม่มีข้อมูล</p> 
                      : targetUser.description
                      }
                  </div>
              </div>
        <div className="p-4 max-w-xl mx-auto">
      </div>
    </div>
    </>
  );
}

export default ViewUserPage;
