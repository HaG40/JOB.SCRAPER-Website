import { useEffect, useState, useContext, useRef } from "react"
import { UserContext } from "../../App"

export default function ResumeSummary() {
    const [resumeScore, setResumeScore] = useState(0)
    const [report, setReport] = useState("")
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext)
    const textareaRef = useRef(null)

    const base64ToFile = (base64, filename) => {
        const byteCharacters = atob(base64)
        const byteNumbers = new Array(byteCharacters.length)

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/pdf" })

        return new File([blob], filename, { type: "application/pdf" })
    }

    useEffect(() => {
        if (!user?.cv) return

        const file = base64ToFile(user.cv, "resume.pdf")
        uploadFile(file)

    }, [user])

    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = el.scrollHeight + "px"
    }, [report])

    const uploadFile = async (file) => {
        const formData = new FormData()
        formData.append("resume_file", file)

        try {
            setLoading(true)

            const res = await fetch("http://localhost:5000/analyze", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            setResumeScore(data.scores)
            setReport(data.report)

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="px-2 mb-7 space-y-2 bg-white flex flex-col">

            <div className="px-4">
                <div className="flex flex-row justify-between">
                    <p className="text-orange-600 mb-2">คะแนน :</p>
                    <p>{loading ? "กำลังวิเคราะห์..." : `${resumeScore} %`}</p>
                </div>

                <p className="text-orange-600 mb-2">รายงาน :</p>
                <textarea
                    ref={textareaRef}
                    className="border rounded-xl text-gray-500 border-gray-200 shadow p-4 resize-none w-full overflow-hidden"
                    readOnly
                    value={report || (loading ? "กำลังวิเคราะห์..." : "ไม่มีข้อมูล")}
                />
            </div>
        </div>
    )
}