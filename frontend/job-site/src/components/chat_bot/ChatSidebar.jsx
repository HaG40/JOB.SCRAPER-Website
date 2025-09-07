import React, { useState, useContext } from "react";
import { ChatContext } from "./ChatContext";
import ResumeAnalyzer from "./ResumeAnalyzer";
import ReactMarkdown from "react-markdown";

function ChatSidebar({ isOpen, onClose }) {
  const { messages, setMessages } = useContext(ChatContext);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
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

  return (
    <div
      className={`fixed top-0 right-0 h-full w-108 bg-white shadow-lg border-l transition-transform duration-300 z-50 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-orange-400 text-white">
        <h2 className="font-bold">🤖 Chatbot</h2>
        <button onClick={onClose} className="font-bold">
          ✖
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
            className={`inline-block px-3 py-2 rounded-lg ${
                msg.role === "user" ? "bg-orange-400 text-white" : "bg-gray-200 text-black"
            }`}
            >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <p className="text-center text-gray-400">⏳ กำลังพิมพ์...</p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex p-3 border-t space-x-2">
        {/* ปุ่ม Resume Analyzer */}
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
  );
}

export default ChatSidebar;
