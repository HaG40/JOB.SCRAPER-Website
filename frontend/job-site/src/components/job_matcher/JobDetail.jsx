import { useContext, useEffect, useRef, useState } from "react";
import { JobCompareContext1 } from "./JobMatcher";

const CACHE_TTL = 1000 * 60 * 10;

function JobDetail() {
  const [jobDetail, setJobDetail] = useState(null);
  const { jobBox1, setDetail } = useContext(JobCompareContext1);
  const textareaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const cacheKey = jobBox1
    ? `jobDetail_${jobBox1.source}_${jobBox1.url}`
    : null;

  useEffect(() => {
    const fetchJobDetail = async () => {
      if (!jobBox1) return;

      try {
        if (cacheKey) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
              setJobDetail(parsed.data);
              setDetail(parsed.data.detail);
              return;
            } else {
              localStorage.removeItem(cacheKey);
            }
          }
        }

        setIsLoading(true);

        const params = new URLSearchParams({
          url: jobBox1.url ?? "",
          source: jobBox1.source ?? "",
        });

        const res = await fetch(
          `http://localhost:8888/api/jobs/detail?${params.toString()}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setJobDetail(data);
        setDetail(data.detail);

        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        }
      } catch (err) {
        console.error("Fetch job detail error:", err);
        setJobDetail(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [jobBox1]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [jobDetail?.detail]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-orange-400 shrink-0" />
        <p className="text-sm text-gray-400">กำลังโหลดรายละเอียด...</p>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <span className="text-2xl">📭</span>
        <p className="text-sm text-gray-400">ไม่พบรายละเอียดงาน</p>
      </div>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      readOnly
      value={jobDetail.detail}
      className="w-full resize-none overflow-hidden rounded-xl border border-gray-100
                 bg-gray-50 px-4 py-3 text-sm text-gray-600 leading-relaxed
                 shadow-sm focus:outline-none"
    />
  );
}

export default JobDetail;