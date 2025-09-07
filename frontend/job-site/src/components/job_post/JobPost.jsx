import { FaPlus } from "react-icons/fa"
import FindJob from "./FindJob"
import RecruitJob from "./RecruitJob"
import ContractJob from "./ContractJob"
import { Link } from "react-router-dom"
import React, { useContext } from "react"
import { AuthContext } from "../../App"
import { toast } from "react-toastify"

function JobPost() {
    const { isAuthenticated } = useContext(AuthContext);

    const handleClick = () => {
        toast.warning("กรุณาเข้าสู่ระบบก่อนทำการโพสต์")
    }
 
    return (
        <>
         <div className='p-4 max-w-xl mx-auto'>
            <h1 className="text-2xl justify-self-center font-bold text-orange-500 ml-4">Job Posts</h1>
         </div>
         <div className="flex flex-row justify-center w-screen h-max px-15 gap-x-8 ">
            <FindJob />
            <RecruitJob />
            <ContractJob />
         </div>
        <div className="fixed bottom-10 right-15">
        {isAuthenticated ? 
        <Link to='/post/create' className="w-16 h-16 bg-orange-500 text-white text-3xl font-semibold rounded-full hover:bg-orange-700 shadow disabled:opacity-50 flex items-center justify-center cursor-pointer">
            <FaPlus/>
        </Link> 
        :
        <button onClick={handleClick} className="w-16 h-16 bg-orange-500 text-white text-3xl font-semibold rounded-full hover:bg-orange-700 shadow disabled:opacity-50 flex items-center justify-center cursor-pointer">
            <FaPlus/>
        </button> 
        }
       
        </div>
        </>

    )
}

export default JobPost