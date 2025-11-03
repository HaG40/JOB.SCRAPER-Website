import { AuthContext, UserContext } from '../../App';
import React, { useContext, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CVViewer from './CVViewer';


function UserBox() {
    const { user } = useContext(UserContext);
    const fullName = `${user.firstName} ${user.lastName}`;
    const [interestedJob, setInterestedJob] = useState(user.interested_job?.split(',') || [""]);
    const [editMode, setEditMode] = useState(false);
    const [cvFile, setCvFile] = useState(null);

    const [requestData, setRequestData] = useState({
        ID: user.id || "",
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        date_of_birth: user.dob || "",
        email: user.email || "",
        interested_job: user.interested_job || "",
        cv: null,
    });

    const handleJobChange = (index, value) => {
        const newJobs = [...interestedJob];
        newJobs[index] = value;
        setInterestedJob(newJobs);
    };

    const addJobField = () => {
        if (interestedJob.length < 3) {
            setInterestedJob([...interestedJob, ""]);
        } else {
            toast.warning("เพิ่มได้สูงสุด 3 งานเท่านั้น", {
                position: "bottom-center",
                hideProgressBar: true,
            });
        }
    };

    const removeJobField = (index) => {
        setInterestedJob(interestedJob.filter((_, i) => i !== index));
    };

    const handleEdit = (e) => {
        e.preventDefault();
        setEditMode(!editMode);
        if (!editMode) toast.info("เปิดโหมดแก้ไขแล้ว");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let cvBytes = null;
        if (cvFile) {
            cvBytes = await cvFile.arrayBuffer();
        }

        const payload = {
            ...requestData,
            interested_job: interestedJob.join(","),
            cv: cvBytes ? Array.from(new Uint8Array(cvBytes)) : null,
        };

        const res = await fetch("http://localhost:8888/api/user/edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            console.log(err);
        } else {
            console.log("completed");
            window.location.replace("/user");
        }
    };

    return (
        <div className='mx-auto max-w-3xl border rounded-xl p-8 mt-5 mb-8 border-gray-300 flex flex-col shadow'>
            {editMode ? (
                <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className='flex flex-row justify-between mb-5'>
                        <input
                            className='text-xl text-orange-600 font-medium userbox'
                            type="text"
                            value={requestData.username}
                            onChange={e => setRequestData({ ...requestData, username: e.target.value })}
                        />
                        <div className='flex space-x-1'>
                            <button onClick={handleEdit} className='bg-gray-400 text-white px-3 py-1.5 rounded hover:bg-gray-500 cursor-pointer'>ยกเลิก</button>
                            <button type='submit' className='bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 cursor-pointer'>เสร็จสิ้น</button>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className='flex flex-col space-y-2'>
                        <div className='flex flex-row'>
                            <label><b>ชื่อ</b>:</label>
                            <input type="text" value={requestData.firstName} onChange={e => setRequestData({ ...requestData, firstName: e.target.value })} />
                        </div>
                        <div className='flex flex-row'>
                            <label><b>นามสกุล</b>:</label>
                            <input type="text" value={requestData.lastName} onChange={e => setRequestData({ ...requestData, lastName: e.target.value })} />
                        </div>
                        <div className='flex flex-row'>
                            <label><b>อีเมลล์</b>:</label>
                            <input type="email" value={requestData.email} onChange={e => setRequestData({ ...requestData, email: e.target.value })} />
                        </div>

                        {/* Interested Jobs */}
                        <div className='flex flex-row justify-between'>
                            <label><b>งานที่สนใจ</b>: (สูงสุด 3 งาน)</label>
                            {interestedJob.length < 3 && <button type="button" onClick={addJobField} className="text-blue-600 hover:underline">เพิ่ม</button>}
                        </div>

                        {interestedJob.map((job, index) => (
                            <div key={index} className='flex flex-row items-center mb-2'>
                                <input type="text" value={job} onChange={e => handleJobChange(index, e.target.value)} className="border p-2 rounded w-full" />
                                {interestedJob.length > 1 && <button type="button" onClick={() => removeJobField(index)} className="ml-2 text-red-500">ลบ</button>}
                            </div>
                        ))}

                        {/* CV Upload */}
                        <label className="mt-2"><b>เรซูเม่</b>: (pdf เท่านั้น)</label>
                        <input id="resume-upload" type="file" accept=".pdf" onChange={e => setCvFile(e.target.files[0])} className="hidden" />
                        <label htmlFor="resume-upload" className="bg-orange-400 text-white px-2 py-1 rounded w-fit cursor-pointer hover:bg-orange-500">
                            อัปโหลดไฟล์
                        </label>

                        {cvFile && <span className="ml-2">{cvFile.name}</span>}
                    </div>
                </form>
            ) : (
                <div>
                    <div className='flex justify-between mb-5'>
                        <h1 className='text-xl text-orange-600 font-medium'>{user.username}</h1>
                        <button onClick={handleEdit} className='cursor-pointer'><FaEdit /></button>
                    </div>
                    <div className='flex flex-col space-y-2 ml-4'>
                        <label><b>ชื่อ</b>: {fullName}</label>
                        <label><b>อายุ</b>: {user.age}</label>
                        <label><b>อีเมลล์</b>: {user.email}</label>
                        <label><b>งานที่สนใจ</b>: {user.interested_job}</label>                        
                        {user.cv ? 
                            <CVViewer/>
                        :
                            <label><b>เรซูเม่</b>: ไม่มีไฟล์</label>
                        }
                        
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserBox;
