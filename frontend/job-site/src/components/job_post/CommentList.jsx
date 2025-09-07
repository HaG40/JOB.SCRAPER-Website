import { useContext, useEffect, useState } from 'react';
import TimeAgo from "../../utils/TimeAgo"
import { AuthContext, UserContext } from '../../App';

function CommentList(props) {

    const { isAuthenticated } = useContext(AuthContext);
    const { user } = useContext(UserContext);
    const [comments,setComments] = useState([])
    const [msg, setMsg] = useState("")
    const [toggle, setToggle] = useState(false)

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(`http://localhost:8888/api/jobs/get/comments?type=${props.postType}&post_id=${props.postID}`,{
                    headers: {"Content-Type" : "application/json"},
                    method:"GET",
                })
                const data = await res.json()
                console.log("Fetch Comments Completed");
                setComments(data)
                // console.log(data)

            }catch (err){
                console.log("Failed fetching comments from "+ props.postType)
                setMsg("ไม่พบความคิดเห็น")
                console.log(msg)
            }
        }

        fetchComments()

    },[])

    return (
        <>
        <div className=" px-5 flex flex-col">
            <h1 className='text-md text-orange-500 font-semibold mb-1'>ความคิดเห็น :</h1>
            {comments.length == 0 ? 
            <>
                <h1 className='flex justify-start text-gray-400 mx-2.5'>{msg}</h1>
            </>        
            :
            <>
            <div className="max-h-15 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {comments.map((comment, index) => 
                    <div className="mx-2 flex flex-col mb-2">
                        <div className="flex flex-row justify-between">
                            <h1 className='text-black flex mb-1 font-semibold'>{comment.username}</h1>
                            <label className='flex justify-end text-gray-400'>{TimeAgo(comment.created_at)}</label>
                        </div>

                        <label className="text-gray-500 flex mx-2.5">{comment.text}</label>
                    </div>            
                )}
            </div>
            </>
            }
        </div>
        </>
    )
}

export default CommentList