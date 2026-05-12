import React, { useContext, useState } from 'react';
import { AuthContext, UserContext } from '../../App';
import { JobCompareContext1 } from '../job_matcher/JobMatcher';
import FavoriteButton from './FavoriteButton';
import { FaSearch, FaPlus, FaMinus } from 'react-icons/fa';
import { toast } from 'react-toastify';

function JobSearch() {
  const [keyword, setKeyword]   = useState('');
  const [page, setPage]         = useState(1);
  const [source, setSource]     = useState('all');
  const [onlyBKK, setOnlyBKK]   = useState(false);
  const [results, setResults]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cache, setCache]       = useState({});
  const [addedJobs, setAddedJobs]   = useState([]);
  const [jobSelected, setJobSelected] = useState(false);

  const { isAuthenticated }       = useContext(AuthContext);
  const { user }                  = useContext(UserContext);
  const { jobBox1, setJobBox1 }   = useContext(JobCompareContext1);

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
    if (jobBox1?.title === job.title && jobBox1?.company === job.company) {
      setJobBox1({});
    }
    setAddedJobs((prev) =>
      prev.filter((j) => !(j.title === job.title && j.company === job.company))
    );
    setJobSelected(false);
    toast.info("นำงานออกแล้ว");
    setJobBox1({});
  };

  const isAdded = (job) =>
    addedJobs.some((j) => j.title === job.title && j.company === job.company);

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
      bkk: onlyBKK,
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

  if (!isAuthenticated || !user) {
    return (
      <div className="w-md flex flex-col items-center justify-center py-16 gap-3 px-4">
        <span className="text-4xl">🔒</span>
        <p className="text-sm font-medium text-gray-500">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
        <p className="text-xs text-gray-400 text-center">
          ฟีเจอร์ค้นหางานสำหรับผู้ใช้ที่ล็อกอินแล้วเท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4 w-md">

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none text-sm" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isLoading}
              placeholder={isLoading ? 'กำลังค้นหา...' : 'ค้นหางานที่ตามหา...'}
              className="w-full border border-gray-100 bg-gray-50 pl-9 pr-4 py-2
                         rounded-xl text-sm text-gray-600 shadow-sm
                         focus:outline-none focus:ring-1 focus:ring-orange-200
                         disabled:cursor-progress"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="shrink-0 bg-orange-400 hover:bg-orange-500 text-white
                       text-sm px-4 py-2 rounded-xl shadow-sm
                       disabled:opacity-50 disabled:cursor-progress transition-colors"
          >
            ค้นหา
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <label>แหล่งที่มา</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isLoading}
              className="border border-gray-100 bg-gray-50 rounded-lg px-2 py-1
                         text-sm text-gray-600 shadow-sm focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="jobbkk">JobBKK.com</option>
              <option value="jobthai">JobThai.com</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyBKK}
              onChange={(e) => setOnlyBKK(e.target.checked)}
              disabled={isLoading}
              className="h-3.5 w-3.5 accent-orange-400"
            />
            ภายในกรุงเทพฯ
          </label>
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-4" />

      {/* Results header */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
          ผลการค้นหา
        </p>
        {results.length > 0 && !isLoading && (
          <span className="text-xs text-gray-400">หน้า {page}</span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-orange-400" />
          <p className="text-sm text-gray-400">กำลังโหลด...</p>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-2">
          <span className="text-2xl">🔍</span>
          <p className="text-sm text-gray-400">ไม่พบข้อมูล</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <div className="space-y-3">
            {results.map((job, index) => {
              const added = isAdded(job);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border shadow-sm transition-colors
                    ${added
                      ? "bg-orange-400 border-orange-300"
                      : "bg-white border-gray-100"
                    }`}
                >
                  <div className="flex justify-between items-start gap-3">

                    {/* Job info */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate
                        ${added ? "text-white" : "text-orange-500"}`}>
                        {job.title}
                      </h3>
                      <p className={`text-xs ${added ? "text-orange-100" : "text-gray-500"}`}>
                        {job.company}
                      </p>
                      {job.location && (
                        <p className={`text-xs ${added ? "text-orange-100" : "text-gray-400"}`}>
                          📍 {job.location}
                        </p>
                      )}
                      {job.salary && (
                        <p className={`text-xs ${added ? "text-orange-100" : "text-gray-400"}`}>
                          💰 {job.salary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs underline
                            ${added ? "text-white" : "text-blue-400 hover:text-blue-600"}`}
                        >
                          ดูงานนี้
                        </a>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full
                          ${added
                            ? "bg-orange-300 text-white"
                            : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                          {job.source}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {added ? (
                        <button
                          type="button"
                          onClick={() => handleUnselect(job)}
                          className="p-2 bg-orange-700 text-white rounded-full shadow
                                     transition hover:scale-110"
                        >
                          <FaMinus size={12} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={jobSelected ? undefined : () => handleSelect(job)}
                          className={`p-2 rounded-full shadow text-white transition
                            ${jobSelected
                              ? "bg-gray-200 cursor-not-allowed"
                              : "bg-orange-500 hover:scale-110 cursor-pointer"
                            }`}
                        >
                          <FaPlus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-5">
            <button
              onClick={() => fetchResults(page - 1)}
              disabled={page <= 1 || isLoading}
              className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm
                         hover:bg-orange-500 disabled:opacity-30 shadow transition-colors"
            >
              ← ก่อนหน้า
            </button>
            <span className="text-xs text-gray-400">หน้า {page}</span>
            <button
              onClick={() => fetchResults(page + 1)}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm
                         hover:bg-orange-500 disabled:opacity-30 shadow transition-colors"
            >
              ถัดไป →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default JobSearch;