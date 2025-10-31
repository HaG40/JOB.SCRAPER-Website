import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import FavoriteButton from "../job_search/FavoriteButton";

function GetRecommendJob (props) {
    const { user } = useContext(UserContext)
    const [ results, setResults] = useState([])
    const [ isLoading, setIsLoading ] = useState(false)

        useEffect(() => {
        if (user && user.cv && props.recommend != null){
            getRecCv();
        // console.log(cVRecommendations)
        }

    }, [user.id]);

    const getRecCv = async () => {
        try {
        const res = await fetch(`http://localhost:8888/api/jobs/recommend/search?keyword=${props.recommend}`);

        if (!res.ok) throw new Error("Something went wrong");
        const data = await res.json();
        setResults(data);

        } catch (err) {
        console.error("Fetch error:", err);
        setResults([]);
        } finally {
        setIsLoading(false);
        }
    }
    
    return (
        <>
            <div className="space-y-4 mt-4">
              {results.map((job, index) => (
                <div
                  key={index}
                  className="pb-6 pr-5 pl-5 pt-3 border border-gray-200 rounded-2xl shadow-sm bg-white"
                >

                <div className='flex flex-row justify-between'>
                  <h3 className="text-lg font-bold text-orange-500 flex justify-self-start mb-3">
                    {job.title}
                  </h3>

                    <FavoriteButton className="flex justify-end" userId={user.id} title={job.title} company={job.company} location={job.location} salary={job.salary} url={job.url} src = {job.source} />

                </div> 
                <div className='mx-4'>
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
                    <span className="font-semibold">ที่มา:</span>{' '}
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {job.source}
                    </span>
                  </p>
                </div>
                </div>
              ))}
            </div>
        </>
    )
}

export default GetRecommendJob