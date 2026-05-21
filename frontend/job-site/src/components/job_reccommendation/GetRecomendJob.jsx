import { useContext, useRef, useState } from "react";
import { UserContext } from "../../App";
import { JobCompareContext1 } from "../job_matcher/JobMatcher";
import { FaPlus, FaMinus, FaSync, FaUpload, FaTimes, FaUser, FaFileAlt, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import { GO_API, AI_API } from "../../utils/api";

const CACHE_TTL      = 1000 * 60 * 10;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ACCEPTED_EXT   = ".pdf,.jpg,.jpeg,.png";
const SOURCE         = { ACCOUNT: "account", UPLOAD: "upload" };

const getPdfPageCount = async (file) => {
  const text = await file.text();
  const matches = text.match(/\/Type[\s]*\/Page[^s]/g);
  return matches ? matches.length : 1;
};

const validateFile = async (file) => {
  if (!ACCEPTED_TYPES.includes(file.type))
    return "รองรับเฉพาะไฟล์ PDF, JPG, JPEG, PNG เท่านั้น";
  if (file.type === "application/pdf") {
    const pages = await getPdfPageCount(file);
    if (pages > 1) return `เรซูเม่ต้องมีเพียง 1 หน้าเท่านั้น (ไฟล์นี้มี ${pages} หน้า)`;
  }
  return null;
};

function GetRecommendJob(props) {
  const { user }                               = useContext(UserContext);
  const { jobBox1, setJobBox1, setUploadedCV } = useContext(JobCompareContext1);

  const hasAccountCV =
    (Array.isArray(props.recommend) && props.recommend.length > 0) ||
    !!props.onAnalyzeAccount;

  const [source, setSource]             = useState(hasAccountCV ? SOURCE.ACCOUNT : SOURCE.UPLOAD);
  const [results, setResults]           = useState([]);
  const [addedJobs, setAddedJobs]       = useState([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [jobSelected, setJobSelected]   = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [fetchDone, setFetchDone]       = useState(false);

  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  const keywords = Array.isArray(props.recommend)
    ? props.recommend.map((k) => (typeof k === "string" ? k.trim() : "")).filter(Boolean).slice(0, 5)
    : [];

  const cacheKey = `recommend_${keywords.join("_")}`;
  const loading  = isLoading || uploadLoading;

  const canAnalyze =
    (source === SOURCE.ACCOUNT && (keywords.length > 0 || !!props.onAnalyzeAccount)) ||
    (source === SOURCE.UPLOAD  && uploadedFile !== null);

  const cancelFetch = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setUploadLoading(false);
  };

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
    if (jobBox1?.title === job.title && jobBox1?.company === job.company) setJobBox1({});
    setAddedJobs((prev) => prev.filter((j) => !(j.title === job.title && j.company === job.company)));
    setJobSelected(false);
    toast.info("นำงานออกแล้ว");
  };

  const isAdded = (job) =>
    addedJobs.some((j) => j.title === job.title && j.company === job.company);
  
  const handleSourceSwitch = (next) => {
    if (next === source) return;
    cancelFetch();           
    setSource(next);
    setResults([]);
    setUploadedFile(null);
    setUploadedCV(null);     
    setAddedJobs([]);
    setJobSelected(false);
    setAnalyzing(false);
    setFetchDone(false);
    setJobBox1({});          
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setFetchDone(false);
    
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    if (source === SOURCE.ACCOUNT) {
      if (keywords.length === 0 && props.onAnalyzeAccount) {
        setIsLoading(true);
        setResults([]);
        try {
          const returnedKeywords = await props.onAnalyzeAccount();
          if (signal.aborted) return;
          if (Array.isArray(returnedKeywords) && returnedKeywords.length > 0) {
            const kws    = returnedKeywords.map((k) => typeof k === "string" ? k.trim() : "").filter(Boolean).slice(0, 5);
            const unique = await fetchJobsByKeywords(kws, signal);
            if (signal.aborted) return;
            setResults(unique);
            const key = `recommend_${kws.join("_")}`;
            localStorage.setItem(key, JSON.stringify({ data: unique, timestamp: Date.now() }));
          }
        } catch (e) {
          if (e?.name !== "AbortError") setResults([]);
        } finally {
          if (!signal.aborted) { setIsLoading(false); setFetchDone(true); }
        }
      } else {
        await loadData(signal);
        if (!signal.aborted) setFetchDone(true);
      }
    }

    if (source === SOURCE.UPLOAD && uploadedFile) {
      await fetchByUpload(uploadedFile, signal);
      if (!signal.aborted) setFetchDone(true);
    }
  };

  const fetchJobsByKeywords = async (kws, signal) => {
    const collected = [];
    for (const keyword of kws) {
      if (signal?.aborted) break;
      try {
        const res = await fetch(
          `${GO_API}/jobs/recommend/search?keyword=${encodeURIComponent(keyword)}`,
          { signal }
        );
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data)) collected.push(...data);
      } catch (e) {
        if (e?.name === "AbortError") break;
        console.error(`Failed: ${keyword}`, e);
      }
    }
    return collected.filter(
      (job, i, self) => i === self.findIndex((j) => j.title === job.title && j.company === job.company)
    );
  };
  
  const loadData = async (signal) => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) { setResults(parsed.data); return; }
        localStorage.removeItem(cacheKey);
      }
      await fetchByKeywords(signal);
    } catch { await fetchByKeywords(signal); }
  };

  const fetchByKeywords = async (signal) => {
    setIsLoading(true);
    setResults([]);
    try {
      if (!keywords.length) return;
      const unique = await fetchJobsByKeywords(keywords, signal);
      if (signal?.aborted) return;
      setResults(unique);
      localStorage.setItem(cacheKey, JSON.stringify({ data: unique, timestamp: Date.now() }));
    } catch (e) {
      if (e?.name !== "AbortError") setResults([]);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  // 🔄 แก้ไขฟังก์ชัน handleReload ให้รอบรับทั้งสองฝั่งแบบสมบูรณ์
  const handleReload = async () => {
    cancelFetch();
    setJobBox1({});
    setJobSelected(false);
    setFetchDone(false);
    toast.info("รีโหลดข้อมูลใหม่...");
    
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    if (source === SOURCE.ACCOUNT) {
      localStorage.removeItem(cacheKey);
      await fetchByKeywords(signal);
      if (!signal.aborted) setFetchDone(true);
    } else if (source === SOURCE.UPLOAD && uploadedFile) {
      await fetchByUpload(uploadedFile, signal);
      if (!signal.aborted) setFetchDone(true);
    }
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const error = await validateFile(file);
    if (error) { toast.error(error); return; }
    setUploadedFile(file);
    setUploadedCV(file);
    setResults([]);
    setAnalyzing(false);
  };
  
  const fetchByUpload = async (file, signal) => {
    setUploadLoading(true);
    setResults([]);
    try {
      const formData = new FormData();
      formData.append("resume_file", file);
      const res = await fetch(`${AI_API}/recommend/cv`, { method: "POST", body: formData, signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (signal?.aborted) return;

      const uploadKeywords = Array.isArray(data.jobs)
        ? data.jobs.map((k) => (typeof k === "string" ? k.trim() : "")).filter(Boolean).slice(0, 5)
        : [];

      if (uploadKeywords.length === 0) {
        toast.error("ไม่สามารถวิเคราะห์เรซูเม่ได้ กรุณาลองใหม่");
        return;
      }
      const unique = await fetchJobsByKeywords(uploadKeywords, signal);
      if (signal?.aborted) return;
      setResults(unique);
      toast.success("วิเคราะห์เรซูเม่ สำเร็จ");
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("Upload error:", e);
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        setResults([]);
      }
    } finally {
      if (!signal?.aborted) setUploadLoading(false);
    }
  };
  
  const handleClearUpload = () => {
    cancelFetch();         
    setUploadedFile(null);
    setUploadedCV(null);   
    setResults([]);
    setAnalyzing(false);
    setFetchDone(false);
    setJobBox1({});        
  };

  return (
    <div className="flex flex-col gap-3 px-1">

      {/* ── Source Selector ──────────────────────────────────────── */}
      <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 gap-1">
        <div className="relative group flex-1">
          <button
            type="button"
            disabled={!hasAccountCV}
            onClick={() => hasAccountCV && handleSourceSwitch(SOURCE.ACCOUNT)}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg
                        text-xs font-medium transition-all
                        ${hasAccountCV
                          ? source === SOURCE.ACCOUNT
                            ? "bg-white shadow-sm text-orange-500 border border-orange-100"
                            : "text-gray-400 hover:text-gray-500"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
          >
            <FaUser size={10} />
            เรซูเม่ของผู้ใช้
          </button>

          {!hasAccountCV && (
            <div className="absolute left-2/3 -translate-x-1/2 -bottom-9
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200
                            pointer-events-none bg-orange-600 text-white text-[11px]
                            px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              ยังไม่มีเรซูเม่ในบัญชี ไปอัปโหลดที่หน้าโปรไฟล์ก่อน
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSourceSwitch(SOURCE.UPLOAD)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg
                      text-xs font-medium transition-all
                      ${source === SOURCE.UPLOAD
                        ? "bg-white shadow-sm text-orange-500 border border-orange-100"
                        : "text-gray-400 hover:text-gray-500"
                      }`}
        >
          <FaUpload size={10} />
          อัปโหลดเรซูเม่ใหม่
        </button>
      </div>

      {/* ── Upload Panel ─────────────────────────────────────────── */}
      {source === SOURCE.UPLOAD && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
          {uploadedFile ? (
            <div className="flex items-center justify-between gap-2
                            bg-white border border-orange-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FaFileAlt className="text-orange-400 shrink-0" size={12} />
                <span className="text-xs text-gray-600 truncate">{uploadedFile.name}</span>
              </div>
              <button type="button" onClick={handleClearUpload}
                className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                         border border-orange-200 bg-white text-sm text-orange-400
                         hover:bg-orange-50 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaUpload size={12} />
              เลือกไฟล์เรซูเม่
            </button>
          )}
          <p className="text-[10px] text-gray-500 mt-1.5 text-center">
            รองรับ PDF, JPG, PNG • 1 หน้าเท่านั้น
          </p>
          <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT}
            className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* ── ปุ่มเริ่มวิเคราะห์ ───────────────────────────────────── */}
      {!analyzing && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!canAnalyze || loading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                      text-sm font-medium shadow-sm transition-all
                      ${canAnalyze && !loading
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
        >
          <FaSearch size={12} />
          {source === SOURCE.ACCOUNT ? "วิเคราะห์จากเรซูเม่ของผู้ใช้" : "วิเคราะห์จาก เรซูเม่ ที่อัปโหลด"}
        </button>
      )}

      {/* ── Loading ─────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-orange-400" />
          <p className="text-sm text-gray-400">
            {uploadLoading ? "กำลังวิเคราะห์ เรซูเม่..." : "กำลังค้นหางาน..."}
          </p>
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────── */}
      {!loading && fetchDone && results.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2">
          <span className="text-2xl">🔍</span>
          <p className="text-sm text-gray-400">ไม่พบข้อมูล</p>
        </div>
      )}

      {/* ── Placeholder ──────────────────────────────────────────── */}
      {!loading && !analyzing && (
        <div className="flex flex-col items-center py-8 gap-2">
          <span className="text-2xl">
            {source === SOURCE.UPLOAD && !uploadedFile ? "📤" : "✨"}
          </span>
          <p className="text-sm text-gray-400">
            {source === SOURCE.UPLOAD && !uploadedFile
              ? "เลือกไฟล์เรซูเม่แล้วกดวิเคราะห์"
              : "กดวิเคราะห์เพื่อดูงานที่เหมาะกับคุณ"}
          </p>
        </div>
      )}

      {/* ── Job List ────────────────────────────────────────────── */}
      {!loading && results.length > 0 && (
        <>
          <div className="space-y-3 pr-1">
            {results.map((job, index) => {
              const added = isAdded(job);
              return (
                <div key={index}
                  className={`p-4 rounded-2xl border shadow-sm transition-colors
                    ${added ? "bg-orange-400 border-orange-300" : "bg-white border-gray-100"}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${added ? "text-white" : "text-orange-500"}`}>
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
                        <a href={job.url} target="_blank" rel="noopener noreferrer"
                          className={`text-xs underline ${added ? "text-white" : "text-blue-400 hover:text-blue-600"}`}>
                          ดูงานนี้
                        </a>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full
                          ${added ? "bg-orange-300 text-white" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                          {job.source}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {added ? (
                        <button type="button" onClick={() => handleUnselect(job)}
                          className="p-2 bg-orange-700 text-white rounded-full shadow transition hover:scale-110">
                          <FaMinus size={12} />
                        </button>
                      ) : (
                        <button type="button"
                          onClick={jobSelected ? undefined : () => handleSelect(job)}
                          className={`p-2 rounded-full shadow text-white transition
                            ${jobSelected ? "bg-gray-200 cursor-not-allowed" : "bg-orange-500 hover:scale-110 cursor-pointer"}`}>
                          <FaPlus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🔄 ปรับเงื่อนไขการแสดงผลปุ่มด้านล่างให้แสดงทั้งสองโหมด */}
          <div className="flex justify-between items-center pt-1 border-t border-gray-100">
            {(source === SOURCE.ACCOUNT || (source === SOURCE.UPLOAD && uploadedFile)) && (
              <button onClick={handleReload}
                className="flex items-center gap-2 px-3 py-1 text-gray-400
                           hover:text-gray-500 rounded-lg text-sm transition hover:scale-110">
                <FaSync size={11} />
                รีโหลด
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GetRecommendJob;