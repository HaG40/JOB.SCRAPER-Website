import { useContext } from "react";
import { JobCompareContext1, JobCompareContext2 } from "./JobMatcher";

function CompareResult () {
    const {jobBox1,setJobBox1} = useContext(JobCompareContext1);
    const {jobBox2,setJobBox2} = useContext(JobCompareContext2);

    return (
        <>
        {jobBox1 && 
            <div>
                <p>
                     ชื่องาน : {jobBox1.title}
                </p>
                <p>
                     บริษัท : {jobBox1.company}
                </p>
                <p>
                     สถานที่ : {jobBox1.location}
                </p>
                <p>
                    เงินเดือน : {jobBox1.salary}
                </p>
                        <a
                          href={jobBox1.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 underline hover:text-blue-800"
                        >
                          ดูงานนี้
                        </a>

            </div>
        
        }
        {jobBox2 && 
            <div>
                <p>
                     ชื่องาน : {jobBox2.title}
                </p>
                <p>
                     บริษัท : {jobBox2.company}
                </p>
                <p>
                     สถานที่ : {jobBox2.location}
                </p>
                <p>
                    เงินเดือน : {jobBox2.salary}
                </p>
                        <a
                          href={jobBox2.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 underline hover:text-blue-800"
                        >
                          ดูงานนี้
                        </a>

            </div>
        
        }
        </>
    )
}

export default CompareResult;