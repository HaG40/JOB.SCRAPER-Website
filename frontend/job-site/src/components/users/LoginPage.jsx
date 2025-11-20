import loginIcon from '/login-icon.png';
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function LoginPage() {

    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [redirect, setRedirect] = useState(false)
    const [errormsg, setErrormsg] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault();
       const res = await fetch("http://localhost:8888/api/login", {
            method : "POST",
            headers: {"Content-Type" : "application/json"},
            credentials: "include",
            body: JSON.stringify({
                user,
                password
            })
       })
       if (!res.ok){
        const err = await res.text()
        setErrormsg(err)
        return
       }else {
        toast.success("เข้าสู่ระบบสำเร็จ", {position: "bottom-center", hideProgressBar: true,})
                
        setTimeout(() => {
            setRedirect(true);
        }, 1000);
        }
    }
    
    if (redirect){        
        window.location.replace("/");
    }

    return (
        <div className='p-4 max-w-xl mx-auto border rounded-2xl border-gray-300 justify-self-center px-10 pt-8 pb-12 mt-15 shadow'>
            <div className="flex items-center mb-6">
                <h1 className="text-3xl font-bold text-orange-600 mr-3">เข้าสู่ระบบ</h1>
                <img src={loginIcon} alt="login icon" className="w-12 h-12" />
            </div>
            <form onSubmit={handleSubmit}>
                <div className='justify-self-center flex flex-col'>
                    <div className='flex flex-row'>
                        {errormsg != "" && user == "" ? <label className='flex text-red-500 text-2xl mr-1'>*</label> : <></>}
                        <label className='flex mb-2'>อีเมลล์ / ชื่อผู้ใช้ :</label>

                    </div>
                    <input 
                        type="text"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
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

                    {errormsg != ""  ? <label className='text-red-500 '>** {errormsg}</label>:<></>}

                    <button type='submit' className=' bg-orange-500 text-white px-4 pr-5 pl-5 py-2 mt-5 rounded hover:bg-orange-600 disabled:opacity-50 cursor-pointer shadow'>ล็อกอิน</button>
                    <Link to="/user/register" className='text-blue-600 flex justify-center mt-5 hover:underline cursor-pointer'>ไม่มีบัญชีผู้ใช้?</Link>
                </div>
            </form>
        </div>

    )
}

export default LoginPage    