import { createContext, useState, useEffect } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved
      ? JSON.parse(saved)
      : [{ role: "assistant", content: "สวัสดีค่ะ 👋 ฉันคือ Job Asistant ที่ช่วยวิเคราะห์เรซูเม่ของคุณได้ ลองพิมพ์ข้อความหรือใช้ Resume Analyzer ดูสิ!" }];
  });

  useEffect(() => {
    localStorage.removeItem("chatMessages")
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};
