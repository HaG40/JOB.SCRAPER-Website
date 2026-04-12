import React, { useContext, useEffect, useState } from 'react';
import { AuthContext, UserContext } from '../../App';
import FavoriteButton from '../job_search/FavoriteButton';
import UserBox from './UserBox';

function UserPage() {
    const { isAuthenticated } = useContext(AuthContext);
    const { user } = useContext(UserContext);
    const  [ favJobs, setFavJobs ] = useState([]) 

    useEffect(() => {
    if (!user || !user.id) return;
    
    const fetchFavorites = async () => {
        try {
        const res = await fetch(`http://localhost:8888/api/jobs/favorite?userId=${user.id}`, {
            credentials: "include"
        })
        const data = await res.json();
            setFavJobs(data.reverse())
        } catch (err) {
        console.error("Failed to fetch favorite jobs", err);
        }
    };
        fetchFavorites();
    }, [user]);

  if (!isAuthenticated) {
    return <p className="text-center mt-10">กรุณาเข้าสู่ระบบก่อนดูข้อมูล</p>;
  }

  if (!user) {
    return <p className="text-center mt-10">กำลังโหลดข้อมูลผู้ใช้...</p>;
  }

  return (
    <>
    
        <div className='mx-auto max-w-3xl flex flex-col'>
            <h1 className='text-2xl font-semibold flex items-center text-orange-600 mt-5'>บัญชีผู้ใช้:</h1>
        </div>
        <UserBox />        
      <div className="p-4 max-w-3xl mx-auto">

      <div className='flex flex-col'>
        <h1 className='text-xl font-semibold flex items-center text-orange-600'>งานที่สนใจ:</h1>
      </div>
      <>
            <div className="space-y-4 mt-4">
              {favJobs.map((job, index) => (
                <div
                  key={index}
                  className="pb-5 pr-5 pl-5 pt-3 border border-gray-200 rounded-2xl shadow-sm bg-white"
                >

                <div className='flex flex-row justify-between'>
                  <h3 className="text-lg font-bold text-orange-500 flex justify-self-start mb-4">
                    {job.title}
                  </h3>
                  {isAuthenticated  ? 
                    <FavoriteButton className="flex justify-end" userId={user.id} title={job.title} company={job.company} location={job.location} salary={job.salary} url={job.url} src = {job.source} /> :
                    <FavoriteButton className="flex justify-end" disabled="true" />
                  }
                </div> 
                  <div className='mx-4'>
                    <p className="mt-1 text-gray-700">
                      <span className="font-semibold">บริษัท:</span> {job.company}
                    </p>

                    <p className="mt-1 text-gray-700">
                      <span className="font-semibold">สถานที่:</span> {job.location}
                    </p>

                    <p className="mt-1 text-gray-700">
                      <span className="font-semibold">เงินเดือน:</span> {job.salary}
                    </p>

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      ดูงานนี้
                    </a>

                    <p className="mt-1 text-gray-700 float-right">
                      <span className="font-semibold">ที่มา:</span>{' '}
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        {job.source}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
    </div>
    </>
  );
}

export default UserPage;
