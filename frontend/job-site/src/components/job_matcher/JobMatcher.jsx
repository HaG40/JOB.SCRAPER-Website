import JobReccomendByUserCV from "../job_reccommendation/JobReccomendByUserCV"

function JobMatcher () {
    return (
        <>
        <div className="mx-auto flex flex-row justify-center gap-4 mt-10">
            <JobReccomendByUserCV/>
            <div className="w-xs h-full border border-gray-300 shadow rounded-2xl mt-13">
                <h1 className="p-4 text-xl text-orange-600">เปรียบเทียบงาน</h1>
                <div className="w-full p-4 h-lg flex flex-col justify-center items-center border-y border-gray-200 shadow h-full">
                    <div></div>
                    <div></div>
                </div>
                <p className="p-4 text-lg text-orange-600">ผลลัพธ์ :</p>
            </div>
            <div className="w-xs h-full border border-gray-300 shadow rounded-2xl mt-13">
                <h1 className="p-4 text-xl text-orange-600">งานที่สนใจ</h1>
            </div>
        </div>            
        </>
    )
}

export default JobMatcher