import React, { useContext, useState } from 'react';
import { AuthContext, UserContext } from '../../App';
import FavoriteButton from './FavoriteButton';
import { FaSearch } from 'react-icons/fa';
import JobReccomendByUserPreferences from '../job_reccommendation/JobReccomendByUserPreferences';
import JobReccomendByUserCV from '../job_reccommendation/JobReccomendByUserCV';
import { provinces } from '../../utils/AllProvince';

function JobSearch() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // const [bkkOnly, setBkkOnly] = useState(false);
  const [province, setProvince] = useState("")
  const [source, setSource] = useState("all");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const [cache, setCache] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchResults(1); // Reset to page 1 on new search
  };

  const fetchResults = async (targetPage = page, kw = keyword) => {
    setIsLoading(true);
    document.body.style.cursor = "progress";

    const cacheKey = `${kw}|${targetPage}|${bkkOnly}|${source}`;

    // 🔹 ถ้ามีใน cache แล้ว — ใช้ของเดิม ไม่ต้อง fetch ใหม่
    if (cache[cacheKey]) {
      setResults(cache[cacheKey]);
      setPage(targetPage);
      setIsLoading(false);
      document.body.style.cursor = "default";
      return;
    }

    const params = new URLSearchParams({
      keyword: kw,
      page: targetPage.toString(),
      bkk: bkkOnly.toString(),
      source,
    });

    try {
      const res = await fetch(`http://localhost:8888/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Something went wrong");
      const data = await res.json();

      // 🔹 เก็บลง cache
      setCache((prev) => ({ ...prev, [cacheKey]: data }));
      setResults(data);
      setPage(targetPage);

    } catch (err) {
      console.error("Fetch error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
      document.body.style.cursor = "default";
    }
  };

  return (
    <div className="flex flex-row justify-start"> 
      
      <div className="flex flex-row justify-center w-1/2 mx-auto"> 
      <div className="p-4 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-4 text-orange-500">Job Search</h1>
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <div className="justify-self-center flex flex-row">
          <div className="relative w-full max-w-md mr-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`${
                !isLoading ? 'cursor-text' : 'cursor-progress'
              } border border-gray-400 p-2 pl-10 rounded w-100 shadow`}
              disabled={isLoading}
              placeholder={!isLoading ? 'ค้นหางานที่ตามหา...' : 'กำลังค้นหางาน...'}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="submit"
            className={`${isLoading ? "cursor-progress" : "cursor-default"} bg-orange-400 text-white px-4 pr-5 pl-5 py-2 rounded hover:bg-orange-500 disabled:opacity-50 cursor-pointer shadow`}
            disabled={isLoading}
          >
            ค้นหา
          </button>
        </div>

        <div className="flex items-center ml-4">
        <label className="mr-2">แหล่งที่มา:</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border p-1 mr-4 rounded w-35 cursor-pointer shadow border-gray-400 text-gray-500"
            disabled={isLoading}
          >
            <option value="all">ทั้งหมด</option>
            <option value="jobbkk">JobBKK.com</option>
            <option value="jobthai">JobThai.com</option>
          </select>

          <label className="mr-2">จังหวัด:</label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="border p-1 mr-4 rounded w-35 cursor-pointer shadow border-gray-400 text-gray-500"
            disabled={isLoading}
          >
            <option value="all">ทั้งหมด</option>
            {provinces.map((p,index) => (
              <option key={index} value={p}>{p}</option>
            ))}
          </select>

          {/* <input
            type="checkbox"
            checked={bkkOnly}
            onChange={() => setBkkOnly(!bkkOnly)}
            id="bkkOnly"
            disabled={isLoading}
            className="mr-2 accent-orange-600 cursor-pointer"
          />
          <label htmlFor="bkkOnly">ภายในกทม.</label> */}
        </div>


      </form> 

      <div className="mt-6">
        <div className='flex justify-between'> 
          <h2 className="text-xl font-semibold flex items-center text-orange-500">ผลการค้นหา:</h2>
          
          {results.length > 0 ? 
            <div className='flex items-center'>
              {results.length > 0 ? <p className="text-gray-700">Page: &nbsp;</p> : <></>}
              {!isLoading ? <p className='text-gray-700'>{page}</p> : <p className="animate-spin rounded-full h-4 w-4 border-t-white border-1 border-gray-500"></p>}
            </div>
          : <></>}
          
        </div>

        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-t-white border-2 border-gray-500 justify-self-center mb-2 mt-30"></div>
            <p className="text-gray-500 mt-2 justify-self-center">กำลังโหลด</p>
          </>
        ) : results.length > 0 ? (
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
                  {isAuthenticated  ? 
                    <FavoriteButton className="flex justify-end" userId={user.id} title={job.title} company={job.company} location={job.location} salary={job.salary} url={job.url} src = {job.source} /> :
                    <FavoriteButton className="flex justify-end" disabled="true" />
                  }
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

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => fetchResults(page - 1)}
                disabled={page <= 1 || isLoading}
                className="px-4 pt-0 pb-1 bg-orange-400 text-white text-2xl rounded hover:bg-gray-400 disabled:opacity-50 shadow cursor-pointer"
              >
                &#8592;
              </button>
              <span className="px-4 text-l text-gray-600">Page {page}</span>
              <button
                onClick={() => fetchResults(page + 1)}
                disabled={isLoading}
                className="px-4 pt-0 pb-1 bg-orange-400 text-white text-2xl rounded hover:bg-gray-400 disabled:opacity-50 shadow cursor-pointer"
              >
                &#8594;
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 mt-30 justify-self-center">ไม่พบข้อมูล</p>
        )}
      </div>

    </div>

      <div className="mt-15 ml-10 flex flex-row justify-center gap-4">
        <JobReccomendByUserCV/>        
        <JobReccomendByUserPreferences/>
      </div>

      </div>
    </div>
  );
}



export default JobSearch;
