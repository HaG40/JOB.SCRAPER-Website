import React, { useContext, useState } from 'react';
import { AuthContext, UserContext } from '../../App';
import FavoriteButton from './FavoriteButton';
import { FaSearch } from 'react-icons/fa';
import JobReccomendByUserCV from '../job_reccommendation/JobReccomendByUserCV';
import { provinces } from '../../utils/AllProvince';

function JobSearch() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [province, setProvince] = useState('');
  const [source, setSource] = useState('all');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const [cache, setCache] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchResults(1);
  };

  const fetchResults = async (targetPage = page, kw = keyword) => {
    setIsLoading(true);
    document.body.style.cursor = 'progress';

    const cacheKey = `${kw}|${targetPage}|${source}`;
    if (cache[cacheKey]) {
      setResults(cache[cacheKey]);
      setPage(targetPage);
      setIsLoading(false);
      document.body.style.cursor = 'default';
      return;
    }

    const params = new URLSearchParams({
      keyword: kw,
      page: targetPage.toString(),
      source,
      province,
    });

    try {
      const res = await fetch(`http://localhost:8888/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Something went wrong');
      const data = await res.json();

      setCache((prev) => ({ ...prev, [cacheKey]: data }));
      setResults(data);
      setPage(targetPage);
    } catch (err) {
      console.error('Fetch error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
      document.body.style.cursor = 'default';
    }
  };

  return (
    <div className="flex flex-col items-center px-4 md:px-10">
      <div className="flex flex-col lg:flex-row justify-center max-w-7xl mx-auto gap-2">
        <div className="w-full lg:w-2/4 p-10 flex flex-col">
          <h1 className="text-2xl font-bold mb-4 text-orange-500 text-center lg:text-left">
            Job Search
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 w-xl">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
              <div className="relative w-full sm:w-3/4">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className={`${
                    !isLoading ? 'cursor-text' : 'cursor-progress'
                  } border border-gray-400 p-2 pl-10 rounded w-full shadow`}
                  disabled={isLoading}
                  placeholder={!isLoading ? 'ค้นหางานที่ตามหา...' : 'กำลังค้นหางาน...'}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                type="submit"
                className={`${
                  isLoading ? 'cursor-progress' : 'cursor-pointer'
                } bg-orange-400 text-white px-5 py-2 rounded hover:bg-orange-500 disabled:opacity-50 shadow w-full sm:w-auto`}
                disabled={isLoading}
              >
                ค้นหา
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center sm:justify-start">
              <label className="mr-1 text-sm sm:text-base">แหล่งที่มา:</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="border p-1 rounded shadow border-gray-400 text-gray-500"
                disabled={isLoading}
              >
                <option value="all">ทั้งหมด</option>
                <option value="jobbkk">JobBKK.com</option>
                <option value="jobthai">JobThai.com</option>
                <option value="jobth">JobTh.com</option>
              </select>

              <label className="ml-2 mr-1 text-sm sm:text-base">จังหวัด:</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="border p-1 rounded shadow border-gray-400 text-gray-500"
                disabled={isLoading}
              >
                <option value="all">ทั้งหมด</option>
                {provinces.map((p, index) => (
                  <option key={index} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <div className="mt-6 w-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-orange-500">ผลการค้นหา:</h2>
              {results.length > 0 && (
                <p className="text-gray-700">
                  หน้า: {!isLoading ? page : <span className="animate-spin inline-block">⏳</span>}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400 mb-3"></div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="space-y-4 mt-4">
                  {results.map((job, index) => (
                    <div
                      key={index}
                      className="pb-6 pr-5 pl-5 pt-3 border border-gray-200 rounded-2xl shadow-sm bg-white"
                    >
                      <div className="flex flex-col sm:flex-row justify-between">
                        <h3 className="text-lg font-bold text-orange-500 mb-2">{job.title}</h3>
                        {isAuthenticated ? (
                          <FavoriteButton
                            userId={user.id}
                            title={job.title}
                            company={job.company}
                            location={job.location}
                            salary={job.salary}
                            url={job.url}
                            src={job.source}
                          />
                        ) : (
                          <FavoriteButton disabled="true" />
                        )}
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="font-semibold">บริษัท:</span> {job.company}
                        </p>
                        <p>
                          <span className="font-semibold">สถานที่:</span> {job.location}
                        </p>
                        <p>
                          <span className="font-semibold">เงินเดือน:</span> {job.salary}
                        </p>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 underline hover:text-blue-800"
                        >
                          ดูงานนี้
                        </a>
                        <p className="float-right">
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
                    className="px-4 py-1 bg-orange-400 text-white text-2xl rounded hover:bg-gray-400 disabled:opacity-50 shadow"
                  >
                    &#8592;
                  </button>
                  <span className="text-gray-600 text-base">หน้า {page}</span>
                  <button
                    onClick={() => fetchResults(page + 1)}
                    disabled={isLoading}
                    className="px-4 py-1 bg-orange-400 text-white text-2xl rounded hover:bg-gray-400 disabled:opacity-50 shadow"
                  >
                    &#8594;
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center mt-10">ไม่พบข้อมูล</p>
            )}
          </div>
        </div>
        {/* Trending/Stats - right (sticky) */}
        <div className="w-full lg:w-1/3 p-10 flex flex-col gap-10 lg:sticky lg:top-32 h-fit">
          {/* Trending search box */}
          <div className="border rounded-2xl bg-white shadow-sm p-4 mb-4">
            <h3 className="font-bold mb-2">Recommended Job</h3>
            <hr className="mb-2" />
            <div className="flex flex-wrap gap-2">
              {/* ตัวอย่าง tag สามารถแก้ไขให้ดึงจาก backend ได้ */}
              <span className="border rounded px-2 py-1 text-sm">หางานนิคมอุตสาหกรรม</span>
              <span className="border rounded px-2 py-1 text-sm">หางานโรงแรม</span>
              <span className="border rounded px-2 py-1 text-sm">หางานเชียงใหม่</span>
              <span className="border rounded px-2 py-1 text-sm">หางานภูเก็ต</span>
              <span className="border rounded px-2 py-1 text-sm">หางานขอนแก่น</span>
              <span className="border rounded px-2 py-1 text-sm">หางานครั้ง</span>
              <span className="border rounded px-2 py-1 text-sm">หางานเชียงราย</span>
              <span className="border rounded px-2 py-1 text-sm">หางานชลบุรี</span>
              <span className="border rounded px-2 py-1 text-sm">หางานระยอง</span>
              <span className="border rounded px-2 py-1 text-sm">หางานนนทบุรี</span>
              <span className="border rounded px-2 py-1 text-sm">หางานสมุทรปราการ</span>
              <span className="border rounded px-2 py-1 text-sm">หางานสงขลา</span>
              <span className="border rounded px-2 py-1 text-sm">หางานปทุมธานี</span>
              <span className="border rounded px-2 py-1 text-sm">หางานนครศรีธรรมราช</span>
              <span className="border rounded px-2 py-1 text-sm">หางานปทุมธานี</span>
              <span className="border rounded px-2 py-1 text-sm">หางานพิจิตร</span>
              <span className="border rounded px-2 py-1 text-sm">หางานสุราษฎร์ธานี</span>
              <span className="border rounded px-2 py-1 text-sm">หางานสมุทรสาคร</span>
              <span className="border rounded px-2 py-1 text-sm">หางานสระบุรี</span>
              <span className="border rounded px-2 py-1 text-sm">หางานอุดรธานี</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobSearch;
