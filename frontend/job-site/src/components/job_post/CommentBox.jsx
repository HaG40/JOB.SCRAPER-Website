import React from "react";
import { useContext, useState } from "react";
import { AuthContext, UserContext } from "../../App";

function CommentBox (props) {

    const { isAuthenticated } = useContext(AuthContext);
    const { user } = useContext(UserContext);

    const [text, setText] = useState()

    const HandleSubmit = async (e) => {
        e.preventDefault()

        const res = await fetch(`http://localhost:8888/api/jobs/post/comments?type=${props.postType}`, {
            credentials : 'include',
            headers: {"Content-Type" : "application/json"},
            method : 'POST',
            body : JSON.stringify({
                post_id: props.postID,
                text: text,
                user_id: user.id,
                username: user.username || "Anonymous"
            })
        })
        if (!res.ok) {
                const err = await res.text()
                console.log("Failed Posting Comment: "+ err);
        } else {
                console.log("Posted successfully");
                window.location.replace("/post");
        }

    }

    return (
        <>
        <div className="mx-auto border rounded-2xl border-gray-300 shadow p-2 pl-5 mb-6">
            <form onSubmit={HandleSubmit} className="flex flex-row justify-between">
                <input  
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)} 
                className={`w-full outline-0 ${!isAuthenticated ? "cursor-not-allowed":"cursor-text"}`} 
                placeholder={`${isAuthenticated ? 'แสดงความคิดเห็นหรือสอบถาม...':'กรุณาเข้าสู่ระบบก่อนทำการแสดงความคิดเห็น...'}`} 
                disabled={!isAuthenticated}/>

                <button
                    type="submit"
                    className={`text-white px-6 py-0.5 rounded-2xl ${
                        isAuthenticated ? "bg-blue-500 hover:bg-blue-700 cursor-pointer" : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!isAuthenticated}
                >
                    ส่ง
                </button> 

            </form>
        </div>

        </>
    )
}

export default CommentBox