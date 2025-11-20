import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function RegisterPage() {

    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dob,setDob] = useState("")
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [redirect, setRedirect] = useState(false)
    const [errormsg, setErrormsg] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault();
       const res = await fetch("http://localhost:8888/api/register", {
            method : "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({
                username,
                firstname: firstName,
                lastname: lastName,
                date_of_birth: dob,
                email,
                password
            })
       })
       if (!res.ok){
        const err = res.text()
        setErrormsg(err)
        return
       } else {
        toast.success("ลงทะเบียนผู้ใช้สำเร็จ", {position: "bottom-center", hideProgressBar: true,});
              
        setTimeout(() => {
            setRedirect(true);
        }, 1000);
       }
    }
    
    if (redirect){
        window.location.replace("/");
    }

    return (
      <div className="flex flex-col lg:flex-row max-w-4xl mx-auto w-full">
        {/* Left info box (only on large screens) */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">หางาน ได้งานเร็วต้อง JOBJAB TH</h2>
          <ul className="space-y-6 text-gray-700">
            <li>
              <span className="font-bold text-lg flex items-center mb-1">
                <span className="mr-2">🔍</span> หางานง่าย สะดวก รวดเร็ว กับ JOBJAB TH
              </span>
              <span className="block ml-7">PLACE HOLDER || หางาน สมัครงานออนไลน์ ฟรี! ไม่มีค่าใช้จ่าย</span>
              <span className="block ml-7">PLACE HOLDER || เพียงมีเรซูเม่จาก JOBJAB TH กดปุ่ม “Job Match” ได้ทันที</span>
              <span className="block ml-7">PLACE HOLDER || มีช่องทางสมัครงานอื่น ๆ อีก 3 วิธีให้ผู้สมัครได้เลือกสมัคร</span>
            </li>
            <li>
              <span className="font-bold text-lg flex items-center mb-1">
                <span className="mr-2">🤖</span> ระบบ AI อัจฉริยะ เพื่อช่วยคุณเพิ่มโอกาสได้งาน
              </span>
              <span className="block ml-7">PLACE HOLDER || AI ช่วยสร้างและแนะนำเรซูเม่ให้น่าสนใจ เช่น แนะนำอาชีพ แนะนำทักษะที่ควรระบุ ฯลฯ</span>
              <span className="block ml-7">PLACE HOLDER || ระบบ Matching ที่จะช่วยแมชชิ่งเรซูเม่ของคุณกับตำแหน่งงานที่ผู้ประกอบการ</span>
              <span className="block ml-7">PLACE HOLDER || และระบบ Job Match ช่วยจับคู่แมทช์งานกับเรซูเม่ของคุณโดยอัตโนมัติ</span>
            </li>
            <li>
              <span className="font-bold text-lg flex items-center mb-1">
                <span className="mr-2">⭐</span> PLACE HOLDER || ฟีเจอร์พิเศษ เพื่อเพิ่มโอกาสถูกเรียกสัมภาษณ์มากกว่า 90%
              </span>
              <span className="block ml-7">PLACE HOLDER || ระบบ “ต้องการงานด่วน” แจ้งให้ผู้ประกอบการรู้ว่าคุณพร้อมเริ่มงานทันทีภายใน 7/15/30 วัน</span>
              <span className="block ml-7">PLACE HOLDER || ระบบ “Resume Premium” ที่ช่วยให้โปรไฟล์ของคุณถูกมองเห็นก่อนใคร</span>
            </li>
          </ul>
        </div>
        {/* Register form - right */}
        <div className='p-4 w-full lg:w-1/2 border rounded-2xl border-gray-300 justify-self-center px-10 pt-8 pb-12 my-15 shadow'>
            <h1 className="text-3xl font-bold mb-6 text-orange-600">ลงทะเบียน</h1>
            <form onSubmit={handleSubmit}>
                <div className='justify-self-center flex flex-col'>
                    {/* ...existing form code... */}
                    <div className='flex flex-row'>
                        {errormsg != "" && username == "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                        <label className='mb-2'>ชื่อผู้ใช้ :</label>
                    </div>            
                    <input 
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`border p-2 rounded w-85 mb-4 shadow border-gray-400` }
                        placeholder='username'
                    />
                    {/* ...rest of form code unchanged... */}
                    <div className='flex flex-row'>
                        {errormsg != "" && firstName == "" && lastName == "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                        <label className='mb-2'>ชื่อจริง :</label>
                    </div>            
                    <input 
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`border p-2 rounded w-85 mb-2 shadow border-gray-400` }
                        placeholder='ชื่อ'
                    />
                    <input 
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`border p-2 rounded w-85 mb-4 shadow border-gray-400` }
                        placeholder='นามสกุล'
                    />
                    <div className='flex flex-row'>
                        {errormsg !== "" && dob === "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                        <label className='mb-2'>วันเกิด :</label>
                    </div>
                    <input 
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="border p-2 rounded w-85 mb-4 shadow border-gray-400"
                    />
                    <div className='flex flex-row'>
                        {errormsg != "" && email == "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                        <label className='mb-2'>อีเมลล์ :</label>
                    </div>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`border p-2 rounded w-85 mb-4 shadow border-gray-400` }
                        placeholder='example@gmail.com'
                    />

                    <div className='flex flex-row justify-between'>
                        <div className='flex flex-row'>
                            {errormsg != "" && password == "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                            <label className='mb-2'>รหัสผ่าน :</label>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="flex justify-end cursor-pointer hover:underline text-gray-400 mr-1"
                        >
                            {showPass ? "ซ่อน" : "แสดง"}
                        </button>
                    </div>

                    <input 
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`border p-2 rounded w-85 mb-4 shadow border-gray-400` }
                        placeholder={showPass ? 'Password1234 ': '************'}
                        
                    />
                    <div className='flex flex-row'>
                        {errormsg != "" && confirmPassword == "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                        <label className='mb-2'>ยืนยันรหัสผ่าน :</label>
                    </div>
                    <input 
                        type={showPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`border p-2 rounded w-85 mb-4 shadow border-gray-400` }
                        placeholder={showPass ? 'Password1234 ': '************'}
                        
                    />
                    
                    {errormsg != ""  ? <label className='text-red-500 '>** {errormsg}</label>:<></>}
                    {password !== '' && confirmPassword !== '' && password !== confirmPassword ? <label className='text-red-500 '>** โปรดใส่รหัสผ่านให้ตรงกัน</label>:<></>}
                    

                    <button type='submit' className=' bg-orange-500 text-white px-4 pr-5 pl-5 py-2 mt-5 rounded hover:bg-orange-600 disabled:opacity-50 cursor-pointer'>ลงทะเบียน</button>
                    <Link to="/user/login" className='text-blue-600 flex justify-center mt-5 hover:underline cursor-pointer'>มีบัญชีผู้ใช้อยู่แล้ว</Link>
                </div>
            </form>
        </div>
      </div>
    )
}

export default RegisterPage