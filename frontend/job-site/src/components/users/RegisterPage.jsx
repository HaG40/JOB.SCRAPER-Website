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
        <div className='p-4 max-w-xl mx-auto border rounded-2xl border-gray-300 justify-self-center px-10 pt-8 pb-12 my-15 shadow'>
            <h1 className="text-3xl font-bold mb-6 text-orange-600">ลงทะเบียน</h1>
            <form onSubmit={handleSubmit}>
                <div className='justify-self-center flex flex-col'>
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
    )
}

export default RegisterPage