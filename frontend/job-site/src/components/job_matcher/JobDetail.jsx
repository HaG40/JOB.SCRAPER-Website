import { useContext, useEffect, useRef, useState, createContext } from "react";
import { JobCompareContext1 } from "./JobMatcher";

const CACHE_TTL = 1000 * 60 * 10;
const jobDetailContext = createContext();

function JobDetail() {
    const [jobDetail, setJobDetail] = useState(null);
    const { jobBox1, detail, setDetail } = useContext(JobCompareContext1);
    const textareaRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    const cacheKey = jobBox1
        ? `jobDetail_${jobBox1.source}_${jobBox1.url}`
        : null;

    const params = new URLSearchParams({
        url: jobBox1 ? jobBox1.url : "",
        source: jobBox1 ? jobBox1.source : "",
    });

    useEffect(() => {
        const fetchJobDetail = async () => {
            if (!jobBox1) return;

            try {
                if (cacheKey) {
                    const cached = localStorage.getItem(cacheKey);

                    if (cached) {
                        const parsed = JSON.parse(cached);

                        // เช็ค TTL
                        if (Date.now() - parsed.timestamp < CACHE_TTL) {
                            setJobDetail(parsed.data);
                            setDetail(parsed.data.detail); // อัปเดต detail ใน context
                            return; // ไม่ต้อง fetch
                        } else {
                            localStorage.removeItem(cacheKey);
                        }
                    }
                }

                setIsLoading(true);

                const res = await fetch(
                    `http://localhost:8888/api/jobs/detail?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                setJobDetail(data);
                setDetail(data.detail); // อัปเดต detail ใน context

                if (cacheKey) {
                    localStorage.setItem(
                        cacheKey,
                        JSON.stringify({
                            data,
                            timestamp: Date.now(),
                        })
                    );
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

    return isLoading ? (
        <div className="flex flex-row gborder rounded-xl text-gray-500 border-gray-200 shadow p-6 m-2 gap-2 items-center w-full">
            <p className="animate-spin rounded-full h-4 w-4 border-t-white border border-gray-500 ml-2"></p>
            <p className="text-gray-500">กำลังโหลดรายละเอียด...</p>
        </div>
    ) : (
        <textarea
            ref={textareaRef}
            className="border rounded-xl text-gray-500 border-gray-200 shadow p-4 resize-none w-full overflow-hidden"
            readOnly
            value={jobDetail ? jobDetail.detail : ""}
        />
    );
}

export default JobDetail;