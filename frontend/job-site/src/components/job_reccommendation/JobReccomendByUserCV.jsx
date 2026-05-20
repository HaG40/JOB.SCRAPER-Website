import { useContext } from "react";
import { AuthContext, UserContext } from "../../App";
import GetCVJobs from "./GetCVJobs";

function JobReccomendByUserCV() {
  const { user } = useContext(UserContext);
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated || !user) {
    return (
      <div className="w-md flex flex-col items-center justify-center py-16 gap-3 px-4">
        <span className="text-4xl">🔒</span>
        <p className="text-sm font-medium text-gray-500">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
        <p className="text-xs text-gray-400 text-center">
          ฟีเจอร์แนะนำงานสำหรับผู้ใช้ที่ล็อกอินแล้วเท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="w-md flex flex-col border-b border-gray-100 bg-white overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
          แนะนำสำหรับคุณ
        </p>
        <h1 className="text-base font-semibold text-orange-500 mt-0.5">
          ✨ งานที่เหมาะกับเรซูเม่ของคุณ
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-4 flex-1">
        {user.cv ? (
          // มี CV ในระบบ → โหลดผลจาก CV ที่บันทึกไว้ + ยังอัปโหลดใหม่ได้
          <GetCVJobs />
        ) : (
          // ไม่มี CV ในระบบ → แสดงเฉพาะ upload section
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2 py-6">
              <span className="text-3xl">📄</span>
              <p className="text-sm font-medium text-gray-400">ยังไม่มีเรซูเม่ในระบบ</p>
              <p className="text-xs text-gray-300 text-center">
                อัปโหลด CV เพื่อรับการแนะนำงานที่เหมาะกับคุณ
              </p>
            </div>
            <GetCVJobs uploadOnly />
          </div>
        )}
      </div>

    </div>
  );
}

export default JobReccomendByUserCV;