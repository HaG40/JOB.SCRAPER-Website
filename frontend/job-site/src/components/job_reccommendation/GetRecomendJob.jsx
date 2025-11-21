import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import { JobCompareContext1 } from "../job_matcher/JobMatcher";
import { JobCompareContext2 } from "../job_matcher/JobMatcher";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";

function GetRecommendJob(props) {
  const { user } = useContext(UserContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { jobBox1, setJobBox1 } = useContext(JobCompareContext1);
  const { jobBox2, setJobBox2 } = useContext(JobCompareContext2);

  useEffect(() => {
    if (user && props.recommend.length > 0) {
      getRec();
    }
  }, []);

  useEffect(() => {
    console.log("Updated Box1:", jobBox1);
  }, [jobBox1]);

  useEffect(() => {
    console.log("Updated Box2:", jobBox2);
  }, [jobBox2]);

  // 🟩 กดเลือกงาน → เพิ่มเข้า context → ลบออกจาก results
  const handleSelect = (job) => {
    if (!jobBox1 || Object.keys(jobBox1).length === 0) {
      setJobBox1(job);
      delMapItem(job)
      toast.success("เพิ่มงานสำเร็จ")
    } else if (!jobBox2 || Object.keys(jobBox2).length === 0) {
      setJobBox2(job);
      delMapItem(job)
      toast.success("เพิ่มงานสำเร็จ")
    } else {
      toast.error("ไม่สามารถเพิ่มงานได้มากกว่านี้")
    }
  };

  const delMapItem = (job) => {
    setResults((prev) =>
      prev.filter(
        (item) =>
          !(item.title === job.title && item.company === job.company)
      )
    );
  }

  const getRec = async () => {
    setIsLoading(true);
    try {
      const keywords = props.recommend.slice(0, 5);

      const responses = await Promise.all(
        keywords.map((keyword) =>
          fetch(`http://localhost:8888/api/jobs/recommend/search?keyword=${keyword}`)
        )
      );

      const dataArrays = await Promise.all(responses.map((res) => res.json()));
      const merged = dataArrays.flat();

      const unique = merged.filter(
        (job, index, self) =>
          index ===
          self.findIndex(
            (j) => j.title === job.title && j.company === job.company
          )
      );

      setResults(unique);
    } catch (err) {
      console.error("Fetch error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <p className="animate-spin rounded-full h-4 w-4 border-t-white border-1 border-gray-500 ml-2"></p>
      )}
      {/* {results.length === 0 && (
        <p className="text-gray-500 mt-30 justify-self-center">ไม่พบข้อมูล</p>
      )} */}

      <div className="space-y-4 mt-4 w-sm">
        {results.map((job, index) => (
          <div
            key={index}
            className="p-5 border border-gray-200 rounded-2xl shadow-sm bg-white"
          >
            <div className="flex flex-row justify-between gap-5">
              <div className="flex flex-col justify-start">
                <h3 className="text-md font-bold text-orange-500 flex justify-self-start">
                  {job.title}
                </h3>

                <p className="text-orange-700 text-sm">
                  <span className="font-semibold">บริษัท:</span> {job.company}
                </p>
              </div>

              <button
                type="button"
                className="p-2 flex h-fit justify-end hover:bg-orange-600 cursor-pointer bg-orange-500 text-white rounded-full shadow"
                onClick={() => handleSelect(job)}
              >
                <FaPlus />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default GetRecommendJob;
