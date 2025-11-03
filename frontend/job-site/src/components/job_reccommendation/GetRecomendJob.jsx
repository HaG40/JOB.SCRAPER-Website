import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import FavoriteButton from "../job_search/FavoriteButton";

function GetRecommendJob(props) {
  const { user } = useContext(UserContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && props.recommend.length > 0) {
      getRec();
    }
  }, []);

  const getRec = async () => {
    setIsLoading(true);
    try {
      const keywords = props.recommend.slice(0, 3);

      const responses = await Promise.all(
        keywords.map((keyword) =>
          fetch(`http://localhost:8888/api/jobs/recommend/search?keyword=${keyword}`)
        )
      );

      const dataArrays = await Promise.all(responses.map((res) => res.json()));
      const merged = dataArrays.flat();
      const unique = merged.filter(
        (job, index, self) =>
          index === self.findIndex(
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
      {isLoading && <p className="animate-spin rounded-full h-4 w-4 border-t-white border-1 border-gray-500 ml-2"></p>}
      {results.length == 0 || results == [] && <p className="text-gray-500 mt-30 justify-self-center">ไม่พบข้อมูล</p>}
      <div className="space-y-4 mt-4 w-sm">
        {results.map((job, index) => (
          <div
            key={index}
            className="pb-6 pr-5 pl-5 pt-3 border border-gray-200 rounded-2xl shadow-sm bg-white"
          >
            <div className="flex flex-row justify-between">
              <h3 className="text-lg font-bold text-orange-500 flex justify-self-start mb-3">
                {job.title}
              </h3>

              <FavoriteButton
                className="flex justify-end"
                userId={user.id}
                title={job.title}
                company={job.company}
                location={job.location}
                salary={job.salary}
                url={job.url}
                src={job.source}
              />
            </div>

            <div className="mx-4">
              <p className="mt-1 text-gray-700">
                <span className="font-semibold">บริษัท:</span> {job.company}
              </p>

              <p className="mt-1 text-gray-700">
                <span className="font-semibold">สถานที่:</span> {job.location}
              </p>

              <p className="mt-1 text-gray-700">
                <span className="font-semibold">เงินเดือน:</span> {job.salary}
              </p>

              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-blue-600 underline hover:text-blue-800"
              >
                ดูงานนี้
              </a>

              <p className="mt-1 text-gray-700 float-right">
                <span className="font-semibold">ที่มา:</span>{" "}
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                  {job.source}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default GetRecommendJob;

