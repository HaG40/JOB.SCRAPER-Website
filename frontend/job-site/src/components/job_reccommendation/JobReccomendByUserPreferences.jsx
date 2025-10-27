import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";

function JobReccomendByUserPreferences() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(UserContext);

  const fetchJobRecommendations = async () => {
    setIsLoading(true);
    document.body.style.cursor = "progress";

    try {
      const res = await fetch(`http://localhost:8888/api/jobs/preferences?userId=${user.id}`);

      if (!res.ok) throw new Error("Something went wrong");

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.warn("Response is not JSON:", text);
        data = [];
      }

      setJobs(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setJobs([]);
    } finally {
      setIsLoading(false);
      document.body.style.cursor = "default";
    }
  };

  useEffect(() => {
    fetchJobRecommendations();
  }, []);

  return (
    
    <div className="p-2 w-3xs">
      <h1 className="text-lg font-bold mb-4 text-orange-500">งานที่คุณอาจจะสนใจ</h1>

      {isLoading && <p>กำลังโหลด...</p>}

      <ul className="space-y-2">
        {jobs.length > 0 ? (
          jobs.map((job, i) => (
            <li key={job.id || i} className="p-3 border rounded-lg hover:bg-orange-50 transition">
              <p className="font-semibold">{job.title}</p>
              {job.company && <p className="text-sm text-gray-600">{job.company}</p>}
              {job.location && <p className="text-xs text-gray-500">{job.location}</p>}
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-500 underline"
                >
                  ดูรายละเอียด
                </a>
              )}
            </li>
          ))
        ) : (
          !isLoading && <p className="text-gray-500">ไม่มีข้อมูลในขณะนี้</p>
        )}
      </ul>
    </div>
  );
}

export default JobReccomendByUserPreferences;
