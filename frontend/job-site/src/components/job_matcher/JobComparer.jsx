import { useContext } from "react"
import { JobCompareContext1, JobCompareContext2 } from "./JobMatcher"

function JobComparer () {

    const { jobBox1 } = useContext(JobCompareContext1)
    const { jobBox2 } = useContext(JobCompareContext2)

    return (
        <div className="w-full p-4 h-lg flex flex-col justify-center items-center border-y border-gray-200 shadow h-full">

            <div className="p-4 border rounded-2xl bg-white shadow my-2 h-lg border-gray-300 w-full">
            {jobBox1 && (
                <>
                    <p className="font-bold text-orange-500">{jobBox1.title}</p>
                    <p className="text-sm text-orange-700">{jobBox1.company}</p>
                </>   
            )}
            </div>
            
            <div className="p-4 border rounded-2xl bg-white shadow my-2 h-lg border-gray-300 w-full">
            {jobBox2 && (
                <>
                    <p className="font-bold text-orange-500">{jobBox2.title}</p>
                    <p className="text-sm text-orange-700">{jobBox2.company}</p>
                </>                
            )}
            </div>            

        </div>   
    )
}

export default JobComparer
