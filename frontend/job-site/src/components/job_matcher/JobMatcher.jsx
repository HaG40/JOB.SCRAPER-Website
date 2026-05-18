import JobReccomendByUserCV from "../job_reccommendation/JobReccomendByUserCV";
import JobSearch from "../job_search/JobSearch";
import Result from "./Result";
import JobSelector from "./JobSelector";
import { createContext, useState } from "react";

export const JobCompareContext1 = createContext();

const TABS = [
  { key: "recommend", label: "✨ แนะนำสำหรับคุณ" },
  { key: "search",    label: "🔍 ค้นหางาน" },
];

function JobMatcher() {
  const [jobBox1, setJobBox1]   = useState(null);
  const [detail, setDetail]     = useState(null);
  const [activeTab, setActiveTab] = useState("recommend");

  const changeTab = (tabKey) => {
    setJobBox1({});
    setDetail(null);
    setActiveTab(tabKey);
    setJobBox1(null);
    setDetail(null);
  }

  return (
    <JobCompareContext1.Provider value={{ jobBox1, setJobBox1, detail, setDetail }}>
      <div className="mx-auto flex flex-row justify-center items-start gap-5 mt-10 px-4">

        {/* ── Left: Job Source ── */}
        <div className="shrink-0 flex flex-col rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">

          {/* Tab header */}
          <div className="flex border-b border-gray-100">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={changeTab.bind(null, tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? "text-orange-500 border-b-2 border-orange-400 bg-orange-50/50"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="pb-2.5 px-2.5">
            {activeTab === "recommend" ? <JobReccomendByUserCV /> : <JobSearch compact />}
          </div>
        </div>

        <div className="w-xl flex flex-col rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              งานที่คุณเลือก
            </p>
            <h1 className="text-base font-semibold text-orange-500 mt-0.5">
              📌 รายละเอียดตำแหน่ง
            </h1>
          </div>
          <JobSelector />
        </div>

        <div className="w-xl flex flex-col rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              การวิเคราะห์ความเหมาะสม
            </p>
            <h1 className="text-base font-semibold text-orange-500 mt-0.5">
              📊 ความเหมาะสมกับคุณ
            </h1>
          </div>
          <Result />
        </div>

      </div>
    </JobCompareContext1.Provider>
  );
}

export default JobMatcher;