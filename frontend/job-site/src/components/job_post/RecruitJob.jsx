import { AuthContext, UserContext } from '../../App';
import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { FaCaretDown,FaCaretUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CommentBox from './CommentBox';
import CommentList from './CommentList';
import TimeAgo from "../../utils/TimeAgo"

function RecruitJob() {

    const { isAuthenticated } = useContext(AuthContext);
    const { user } = useContext(UserContext);
    const [ posts, setPosts ]  = useState([])
    const [showContact, setShowContact] = useState()

    const HandleShowContact = (index) => {
        if (showContact === index) {
            setShowContact(null);            
        } else {
            setShowContact(index);            
        }
    };

    const FormatDate = (str) => {
        const date = new Date(str);

        const formattedDate = date.toLocaleDateString("en-GB"); 
        return formattedDate
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`http://localhost:8888/api/jobs/get/recruit`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    console.log("Failed fetching data from RecruitPost");
                } else {
                    const data = await res.json()
                    console.log("Fetch RecruitPost Completed");
                    setPosts(data)
                    // console.log(data)
                }
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };


        fetchData();
    }, []);

    if (!posts) {
        return <p className="text-center mt-10">กำลังโหลดข้อมูลโพสต์...</p>;
    }

    return (
        <>
            <div className="flex flex-col w-150">
                <h1 className="text-orange-500 font-semibold text-2xl mx-4 border-b-1 border-gray-300 pb-3">จ้างงาน:</h1>
                    <div className="space-y-1.5 mt-4">
                        {posts.map((post, index) => (
                            <>
                            
                           
                            <div
                            key={index}
                            className="pb-6 pr-5 pl-5 pt-3 border border-gray-200 rounded-2xl shadow bg-white flex flex-col"
                            >
                            
                            <div className='flex flex-row justify-between items-center '>
                                <Link 
                                    to='/post/view'
                                    state={{ post: post }}
                                    className='text-lg text-orange-500 font-bold mb-4'
                                >
                                    {post.title}
                                </Link>
                                <label className='flex justify-end text-gray-400'>{TimeAgo(post.CreatedAt)}</label>
                            </div>
                            <div className='mx-4 flex flex-col'>
                                <textarea className='text-gray-500 mb-3 post-text' defaultValue={post.description} readOnly></textarea>
                                {post.company_name != "" ? <label><span className='font-semibold text-black'>บริษัท:</span> {post.company_name}</label> : <></>}
                                {post.location != "" ? <label><span className='font-semibold text-black'>สถานที่:</span> {post.location}</label> : <></>}
                                {post.salary != "" ? <label><span className='font-semibold text-black'>เงินเดือน:</span> {post.salary}</label> : <></>}

                                <div className='flex flex-row justify-between'>
                                    <button 
                                        className='mt-4 mb-2 font-semibold flex justify-start cursor-pointer' 
                                        onClick={() => HandleShowContact(index)}>
                                        ช่องทางการติดต่อ
                                        {showContact === index ?                           
                                            <FaCaretUp className='ml-1 mt-1' />
                                        :
                                            <FaCaretDown className='ml-1 mt-1' />
                                        }                                
                                    </button>
                                    {user?.id == post.posted_by?.ID && isAuthenticated ? 
                                        <Link 
                                            to = '/user'
                                            className='flex justify-end text-gray-400 items-center mt-3'>โพสต์โดย&nbsp;
                                            <span className='text-blue-500 underline'>{post.posted_by?.username}</span>
                                        </Link>                                           
                                        :
                                        <Link 
                                            to='/user/view'
                                            state={{ destId: post.posted_by.ID }} 
                                            className='flex justify-end text-gray-400 items-center mt-3'>โพสต์โดย&nbsp;
                                            <span className='text-blue-500 underline'>{post.posted_by?.username}</span>
                                        </Link>                                         
                                    }
                                </div>

                                {showContact === index ?                                 
                                <div className='mx-2 flex flex-col text-gray-500 '>
                                    {post.email != "" ? <label><span className='font-semibold text-black'>อีเมลล์:</span> {post.email}</label> : <></>}
                                    {post.tel != "" ? <label><span className='font-semibold text-black'>เบอร์โทร:</span> {post.tel}</label> : <></>}
                                    {post.line != "" ? <label><span className='font-semibold text-black'>Line:</span> {post.line}</label> : <></>}
                                    {post.instagram != "" ? <label><span className='font-semibold text-black'>Instagram:</span> {post.instagram}</label> : <></>}
                                    {post.facebook != "" ? <label><span className='font-semibold text-black'>Facebook:</span> {post.facebook}</label> : <></>}
                                    {post.linkedin != "" ? <label><span className='font-semibold text-black'>Linkedin:</span> {post.linkedin}</label> : <></>}
                                </div>
                                :<></>}
                                </div>
                            </div> 
                            <CommentList postID={post.ID} postType={post.type}/>
                            <CommentBox postID={post.ID} postType={post.type}/>
                            </>
                        ))
                        }

                    </div>
            </div>
        </>
    )
}

export default RecruitJob