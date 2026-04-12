import { useContext, useState } from "react";
import { JobCompareContext1 } from "./JobMatcher";
import { AuthContext, UserContext } from "../../App";
import FavoriteButton from "../job_search/FavoriteButton";
import JobDetail from "./JobDetail";
import { FaMinus } from "react-icons/fa";

function JobComparer() {
  const { isAuthenticated } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const { jobBox1, setJobBox1 } = useContext(JobCompareContext1);
  const [toggleDetail, setToggleDetail] = useState(true);

  const hasJob1 = jobBox1 && Object.keys(jobBox1).length > 0;

  const handleClearJob = () => {
    setJobBox1({});
  };

  return (
    <div className="w-full p-4 flex flex-col justify-center items-center">

      {hasJob1 && (
        <div className="p-4 border rounded-xl bg-white shadow my-2 border-gray-200 w-full">
          <div className="flex flex-row justify-between items-center">
            
            <div className="flex flex-col">
              <p className="font-bold text-orange-500">{jobBox1.title}</p>
              <p className="text-sm text-orange-700">{jobBox1.company}</p>
              <p className="mt-2 text-sm text-gray-500">{jobBox1.source}</p>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && user && (
                <FavoriteButton
                  userId={user.id}
                  title={jobBox1.title}
                  company={jobBox1.company}
                  location={jobBox1.location}
                  salary={jobBox1.salary}
                  url={jobBox1.url}
                  src={jobBox1.source}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {hasJob1 && (
        <div className="my-2 w-full">
          <div className="flex flex-row justify-between w-full">
            <p className="text-orange-600 mb-2">รายละเอียดงาน :</p>
            <button
              className="text-blue-500 transition hover:scale-110"
              onClick={() => setToggleDetail(!toggleDetail)}
            >
              {toggleDetail ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
            </button>
          </div>

          {toggleDetail && <JobDetail />}
        </div>
      )}
    </div>
  );
}

export default JobComparer;