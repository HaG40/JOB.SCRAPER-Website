import JobReccomendByUserCV from "../job_reccommendation/JobReccomendByUserCV";
import CompareResult from "./CompareResult";
import JobComparer from "./JobComparer";
import { createContext, useState } from "react";
import { FaMinus } from "react-icons/fa";
import ResumeSummary from "../job_reccommendation/ResumeSummary";

export const JobCompareContext1 = createContext();

function JobMatcher() {
  const [jobBox1, setJobBox1] = useState(null);

  return (
    <>
      <JobCompareContext1.Provider value={{ jobBox1, setJobBox1 }}>
        <div className="mx-auto flex flex-row justify-center gap-4 mt-10">

          <JobReccomendByUserCV />

          <div className="flex flex-col mb-13">
            <div className="w-xl border border-gray-300 shadow rounded-2xl mt-13">
              <div className="flex justify-between items-center p-4">
                <h1 className="text-xl text-orange-600">งานที่คุณเลือก</h1>
              </div>
              <JobComparer />
            </div>

            <div className="w-xl border border-gray-300 shadow rounded-2xl mt-4">
              <div className="flex justify-between items-center p-4">
                <h1 className="text-xl text-orange-600">ภาพรวมเรซูเม่ของคุณ</h1>
              </div>
              <ResumeSummary />
            </div>
          </div>


          <div className="w-xl h-full border border-gray-300 shadow rounded-2xl mt-13">
            <h1 className="p-4 text-xl text-orange-600">ความเหมาะสมกับคุณ</h1>
            <CompareResult />
          </div>

        </div>
      </JobCompareContext1.Provider>
    </>
  );
}

export default JobMatcher;