import React, { useState, useContext, useRef, useEffect } from "react";
import { ChatContext } from "./ChatContext";
import ResumeAnalyzer from "./ResumeAnalyzer";
import ReactMarkdown from "react-markdown";
import { UserContext, AuthContext } from "../../App";
import { FaTimes, FaRobot } from "react-icons/fa";

function ChatSidebar() {
  const { messages, setMessages } = useContext(ChatContext);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const { user } = useContext(UserContext);

  const chatEndRef = useRef(null);

  // ฟังก์ชันส่งข้อความปกติ
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
        const url ="http://localhost:5000/chat";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Chat API Error");
      const data = await res.json();

      const botMsg = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ เกิดข้อผิดพลาด" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  return (
    <>
      <div
        className={`fixed top-0 bottom-0 right-0 w-[600px] bg-yellow-50 shadow-lg border-l transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 bg-orange-400 text-white">
          <h2 className="font-bold">🤖 Chatbot</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="font-bold px-2 py-1 bg-orange-500 rounded hover:bg-orange-600"
          >
            ✖
          </button>
        </div>

        {isAuthenticated ? (
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <h1 className="mb-1 text-orange-600 font-bold">
                  {msg.role === "user" ? user.username : "🤖 Job Assistant"}
                </h1>
                <div
                  className={`inline-block px-3 py-2 rounded-lg shadow-lg ${
                    msg.role === "user"
                      ? "bg-orange-400 text-white"
                      : "bg-gray-50 text-black"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-center text-gray-400">
                ⏳ กำลังประมวลผล...
              </p>
            )}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 mt-15">
            <p className="text-center text-orange-700 font-semibold text-lg">
              กรุณาเข้าสู่ระบบเพื่อใช้งาน Job Assistant
            </p>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex p-3 border-t space-x-2 bg-white">
          <button
            type="button"
            onClick={() => setShowAnalyzer(!showAnalyzer)}
            className="bg-orange-400 text-white px-3 py-2 rounded-lg hover:bg-orange-500 cursor-pointer"
          >
            {showAnalyzer ? "❌" : "📂"}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 border p-2 rounded-lg"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 disabled:opacity-50 cursor-pointer"
          >
            ➤
          </button>
        </form>

        {showAnalyzer && <ResumeAnalyzer onClose={() => setShowAnalyzer(false)} />}
      </div>

      {/* Toggle Button (อยู่ติด sidebar และเลื่อนตาม sidebar) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-[120px] right-0 z-50 bg-orange-500 text-white px-3 py-6 rounded-l-lg shadow-lg duration-300 hover:bg-orange-600 transition-all ${
          isOpen ? "translate-x-[-600px]" : "translate-x-0"
        }`}
      >
        {isOpen ? (
          <FaTimes className="text-2xl" />
        ) : (
          <FaRobot className="text-2xl" />
        )}
      </button>
    </>
  );
}

export default ChatSidebar;
