import { useContext } from "react";
import { JobCompareContext1 } from "./JobMatcher";
import { AuthContext, UserContext } from "../../App";
import FavoriteButton from "../job_search/FavoriteButton";
import JobDetail from "./JobDetail";

function JobSelector() {
  const { isAuthenticated } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const { jobBox1, setJobBox1 } = useContext(JobCompareContext1);

  const hasJob1 = jobBox1 && Object.keys(jobBox1).length > 0;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* ── Job Card ── */}
      {hasJob1 && (
        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">

          {/* Header */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">

              {/* Source badge */}
              {jobBox1.source && (
                <span className="self-start text-[11px] font-medium px-2.5 py-0.5
                                 rounded-full bg-orange-50 border border-orange-100
                                 text-orange-400 uppercase tracking-wider">
                  {jobBox1.source}
                </span>
              )}

              <p className="font-bold text-gray-800 text-base leading-snug truncate">
                {jobBox1.title}
              </p>
              <p className="text-sm text-orange-500 font-medium">
                {jobBox1.company}
              </p>

              {/* Location + Salary row */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {jobBox1.location && (
                  <span className="text-xs text-gray-400">📍 {jobBox1.location}</span>
                )}
                {jobBox1.salary && (
                  <span className="text-xs text-gray-400">💰 {jobBox1.salary}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isAuthenticated && user && (
                <FavoriteButton
                  userId={user.id}
                  title={jobBox1.title}
                  company={jobBox1.company}
                  location={jobBox1.location}
                  salary={jobBox1.salary}
                  url={jobBox1.url}
                  src={jobBox1.source}
                />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-4" />

          {/* Footer */}
          <div className="flex justify-between items-center">
            <a
              href={jobBox1.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-400 hover:text-blue-600
                         hover:underline transition-colors"
            >
              🔗 ดูรายละเอียดงานต้นฉบับ
            </a>
          </div>
        </div>
      )}

      {/* ── Job Detail ── */}
      {hasJob1 && (
        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">

          {/* Toggle header */}
          <div
            className="w-full flex justify-between items-center px-5 py-4"
          >
            <p className="text-sm font-medium text-orange-500">
              📋 Job Description (JD)
            </p>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="px-5 py-4">
            <JobDetail />
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!hasJob1 && (
        <div className="rounded-2xl border border-dashed border-gray-200
                        bg-gray-50 flex flex-col items-center justify-center
                        py-12 gap-3">
          <span className="text-3xl">🔍</span>
          <p className="text-sm text-gray-400 font-medium">ยังไม่ได้เลือกงาน</p>
          <p className="text-xs text-gray-300">เลือกงานเพื่อเริ่มวิเคราะห์ความเหมาะสม</p>
        </div>
      )}

    </div>
  );
}

export default JobSelector;