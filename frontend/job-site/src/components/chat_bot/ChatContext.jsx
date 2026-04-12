import { createContext, useState, useEffect } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved
      ? JSON.parse(saved)
      : [{ role: "assistant", content: "สวัสดีค่ะ 👋 ฉันคือ Job Asistant ของเว็บไซต์ Job.ScraperTH ฉันเป็น Chatbot ที่จะมาช่วยเหลือคุณในด้านการหางาน, การสมัครงาน และอื่นๆที่เกี่ยวข้องค่ะ" }];
  });

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};
