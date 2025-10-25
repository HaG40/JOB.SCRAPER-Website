import { AuthContext, UserContext } from '../../App';
import React, { useContext, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';


function UserBox() {

    const { isAuthenticated } = useContext(AuthContext);
    const { user } = useContext(UserContext);
    const fullName = `${user.firstName} ${user.lastName}`;
    const [editMode, setEditMode] = useState(false)   
    
    const [requestData, setRequestData] = useState({
        ID : user.id || "",
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        date_of_birth: user.dob || "",
        email: user.email || "",
        description: user.description || "",
    });

    const handleEdit = async (e) => {
      e.preventDefault()
      setEditMode(!editMode)
      if (!editMode) toast.info("เปิดโหมดแก้ไขแล้ว")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const res = await fetch("http://localhost:8888/api/user/edit", {
                method : "PUT",
                headers: {"Content-Type" : "application/json"},
                credentials: 'include',
                body: JSON.stringify(requestData)
        })
        if(!res.ok){        
            const err = res.text()
            console.log(err)
        } else {
            console.log("completed")
            window.location.replace("/user");
        }
    }

    return (
        <>

        <div className='mx-auto max-w-3xl border rounded-xl p-8 mt-5 mb-8 border-gray-300 flex flex-col shadow'>


        {editMode ? 
        
        <form onSubmit={handleSubmit}>            
        <div className='flex flex-row justify-between mb-5'>
            <div className='flex justify-start'>
                <input 
                className= 'text-xl text-orange-600 font-medium userbox' 
                type="text" 
                value={requestData.username}
                onChange={e =>
                    setRequestData({
                    ...requestData,
                    username: e.target.value
                    })
                }                
                />
            </div>
            <br />
                <div className='flex justify-end space-x-1'>
                    <button className='bg-gray-400 text-white px-3 py-1.5 rounded cursor-pointer hover:bg-gray-500 disabled:opacity-50 shadow'
                    onClick={handleEdit}
                    >ยกเลิก</button>
                    <button className='bg-blue-500 text-white px-3 py-1.5 rounded cursor-pointer hover:bg-blue-600 disabled:opacity-50 shadow'
                    type='submit'
                    >เสร็จสิ้น</button>
                </div>
            </div>


            <div  className='mx-4 flex flex-col space-y-2'>
            <div className='flex flex-row outline:none'>
                <label><b>ชื่อ</b> :&nbsp;</label>
                <input 
                className= 'text-gray-500 userbox'
                type="text" 
                value={requestData.firstName}
                onChange={e =>
                    setRequestData({
                    ...requestData,
                    firstName: e.target.value
                    })
                }                
                />
            </div>
            <div className='flex flex-row '>
                <label><b>นามสกุล</b> :&nbsp;</label>
                <input 
                className= 'text-gray-500 userbox'
                type="text" 
                value={requestData.lastName}
                onChange={e =>
                    setRequestData({
                    ...requestData,
                    lastName: e.target.value
                    })
                }                           
                />
            </div>
            <div className='flex flex-row '>
                <label><b>อีเมลล์</b> :&nbsp;</label>
                <input 
                className= 'text-gray-500 userbox'
                type="email" 
                value={requestData.email}
                onChange={e =>
                    setRequestData({
                    ...requestData,
                    email: e.target.value
                    })
                }                    
                />
            </div>
        </div>
        </form>

        : 
        <>
        <div className='flex flex-row justify-between mb-5'>
            <div className='flex justify-start'>
                <h1 className='text-xl text-orange-600 font-medium '>{user.username}</h1>
            </div>
            <br />
                <button className=' text-gray-400 text-2xl px-3 cursor-pointer hover:text-orange-600 disabled:opacity-50'
                    onClick={handleEdit}
                ><FaEdit / ></button>
            </div>

            <div className='ml-4 flex flex-col space-y-2'>
                <label><b>ชื่อ</b> : {fullName}</label>
                <label><b>อายุ</b> : {user.age}</label>
                <label><b>อีเมลล์</b> : {user.email}</label>
            </div>
        </>
        }
        </div>
        </>
    )
}

export default UserBox