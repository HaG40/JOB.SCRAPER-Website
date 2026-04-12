import { useState, useContext } from "react";
import { JobCompareContext1 } from "./JobMatcher";

function CompareResult() {
  const { jobBox1 } = useContext(JobCompareContext1);
  const [mScore,setMScore] = useState(0);

  const hasJob1 = jobBox1 && Object.keys(jobBox1).length > 0;

  return (
    <>
        <div className="px-2 mb-7 space-y-2 bg-white flex flex-col">
          <div className="flex flex-row justify-between px-4">
            <label className=" text-orange-600 ">คะแนนความเหมาะสม : </label>
            <label className=" justify-end">{mScore} %</label>
          </div>
          
          <div className="px-4">
            <p className=" text-orange-600 mb-2">เหตุผล : </p>
            <div className=" border rounded-xl border-gray-200 shadow h-30 p-3"></div>
          </div>
          
          <div className="px-4">
            <p className=" text-orange-600 mb-2">คำแนะนำ : </p>
            <div className=" border rounded-xl border-gray-200 shadow h-30 p-3"></div>
          </div>

        </div>
    </>
  );
}

export default CompareResult;
