import JobReccomendByUserCV from "../job_reccommendation/JobReccomendByUserCV"
import CompareResult from "./CompareResult"
import JobComparer from "./JobComparer"
import { createContext, useState } from "react"

export const JobCompareContext1 = createContext()
export const JobCompareContext2 = createContext()

function JobMatcher () {

    const [ jobBox1, setJobBox1 ] = useState(null)
    const [ jobBox2, setJobBox2 ] = useState(null)

    return (
        <>
        <JobCompareContext1.Provider value={{jobBox1, setJobBox1}}>
        <JobCompareContext2.Provider value={{jobBox2, setJobBox2}}>
        <div className="mx-auto flex flex-row justify-center gap-4 mt-10">
            <JobReccomendByUserCV/>
            <div className="w-xs h-full border border-gray-300 shadow rounded-2xl mt-13">
                <h1 className="p-4 text-xl text-orange-600">เปรียบเทียบงาน</h1>
                <JobComparer/>
            </div>
            <div className="w-xs h-full border border-gray-300 shadow rounded-2xl mt-13">
                <h1 className="p-4 text-xl text-orange-600">ผลลัพธ์</h1>
                <CompareResult/>
            </div>
        </div>            
        </JobCompareContext2.Provider>
        </JobCompareContext1.Provider>
        </>
    )
}

export default JobMatcher