import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import { JobCompareContext1 } from "../job_matcher/JobMatcher";
import { FaPlus, FaMinus, FaSync } from "react-icons/fa";
import { toast } from "react-toastify";

const CACHE_TTL = 1000 * 60 * 10;

function GetRecommendJob(props) {
  const { user } = useContext(UserContext);
  const [results, setResults] = useState([]);
  const [addedJobs, setAddedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobSelected, setJobSelected] = useState(false);

  const { jobBox1, setJobBox1 } = useContext(JobCompareContext1);

  const keywords = Array.isArray(props.recommend)
    ? props.recommend
        .map((k) => (typeof k === "string" ? k.trim() : ""))
        .filter((k) => k !== "")
        .slice(0, 5)
    : [];

  const cacheKey = `recommend_${keywords.join("_")}`;

  useEffect(() => {
    if (user && keywords.length > 0) {
      loadData();
    }
  }, [user, props.recommend]);

  const handleSelect = (job) => {
    if (!jobBox1 || Object.keys(jobBox1).length === 0) {
      setJobBox1(job);
      setAddedJobs((prev) => [...prev, job]);
      setJobSelected(true);
      toast.success("เพิ่มงานสำเร็จ");
    } else {
      toast.warn("สามารถวิเคราะห์ได้ทีละ 1 งานเท่านั้น");
    }
  };

  const handleUnselect = (job) => {
    if (
      jobBox1 &&
      jobBox1.title === job.title &&
      jobBox1.company === job.company
    ) {
      setJobBox1({});
    }

    setAddedJobs((prev) =>
      prev.filter(
        (j) => !(j.title === job.title && j.company === job.company)
      )
    );

    setJobSelected(false);
    toast.info("นำงานออกแล้ว");
  };

  const loadData = async () => {
    try {
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);

        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setResults(parsed.data);
          return;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }

      await fetchData();
    } catch (err) {
      await fetchData();
    }
  };

  const fetchData = async () => {
    setIsLoading(true);

    try {
      if (keywords.length === 0) {
        setResults([]);
        return;
      }

      const collectedResults = [];

      for (const keyword of keywords) {
        try {
          const res = await fetch(
            `http://localhost:8888/api/jobs/recommend/search?keyword=${encodeURIComponent(
              keyword
            )}`
          );

          if (!res.ok) continue;

          const data = await res.json();

          if (Array.isArray(data)) {
            collectedResults.push(...data);
          }
        } catch {}
      }

      const unique = collectedResults.filter(
        (job, index, self) =>
          index ===
          self.findIndex(
            (j) => j.title === job.title && j.company === job.company
          )
      );

      setResults(unique);

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: unique,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = async () => {
    if (jobSelected){
      toast.warn("กรุณานำงานออกก่อนรีโหลด");
      return;
    }
    
    localStorage.removeItem(cacheKey);
    setResults([]);
    setIsLoading(true); 
    toast.info("รีโหลดข้อมูลใหม่...");
    await fetchData();
  };

  return (
    <>
      {isLoading && (
        <div className="flex flex-row items-center justify-center mt-10 gap-2">
          <p className="animate-spin rounded-full h-4 w-4 border-t-white border border-gray-500 ml-2"></p>
          <p className="text-gray-500">กำลังค้นหางาน...</p>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <p className="text-gray-500 mt-30 justify-self-center">ไม่พบข้อมูล</p>
      )}

      {!isLoading && (
        <div className="space-y-4 mt-4 mb-4 w-full">
          {results.map((job, index) => {
            const isAdded = addedJobs.some(
              (j) => j.title === job.title && j.company === job.company
            );

            return (
              <div
                key={index}
                className={`p-5 border border-gray-200 rounded-2xl shadow-sm ${
                  isAdded ? "bg-orange-400" : "bg-white"
                }`}
              >
                <div className="flex flex-row justify-between items-center gap-5">
                  <div className="flex flex-col">
                    <h3
                      className={`text-md font-bold ${
                        isAdded ? "text-white" : "text-orange-500"
                      }`}
                    >
                      {job.title}
                    </h3>

                    <p
                      className={`text-sm ${
                        isAdded ? "text-white" : "text-orange-700"
                      }`}
                    >
                      <span className="font-semibold">บริษัท:</span>{" "}
                      {job.company}
                    </p>
                  </div>

                  {isAdded ? (
                    <button
                      type="button"
                      className="cursor-pointer p-2 bg-orange-800 text-white rounded-full shadow transition hover:scale-110"
                      onClick={() => handleUnselect(job)}
                    >
                      <FaMinus />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={
                        jobSelected
                          ? "cursor-not-allowed p-2 bg-gray-300 text-white rounded-full shadow"
                          : "cursor-pointer p-2 bg-orange-500 text-white rounded-full shadow transition hover:scale-110"
                      }
                      onClick={
                        jobSelected ? undefined : () => handleSelect(job)
                      }
                    >
                      <FaPlus />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <div className="flex justify-start">
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 text-gray-400 hover:text-gray-500 hover:cursor-pointer rounded-lg text-md transition hover:scale-110"
          >
            <FaSync />
            รีโหลด
          </button>
        </div>
      )}
    </>
  );
}

export default GetRecommendJob;