import { Routes, Route, Link, useLocation } from 'react-router-dom';
import JobPost from './components/job_post/JobPost';
import JobSearch from './components/job_search/JobSearch';
import LoginPage from './components/users/LoginPage';
import RegisterPage from './components/users/RegisterPage';
import UserPage from './components/users/UserPage';
import ViewUserPage from './components/users/ViewUserPage';
import ViewPost from './components/job_post/ViewPost';
import CreatePost from './components/job_post/CreatePost';
import Logout from './components/users/Logout';
import { ToastContainer } from 'react-toastify';
import { useEffect, useState, createContext } from 'react';
import calculateAge from "./utils/CalculateAge"

// 👉 import chatbot
import ChatSidebar from './components/chat_bot/ChatSidebar';
import { ChatProvider } from './components/chat_bot/ChatContext';

export const AuthContext = createContext();
export const UserContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); 
  const location = useLocation();
  const [showChat, setShowChat] = useState(false); // ✅ toggle chatbot

  useEffect(() => {
    fetch("http://localhost:8888/api/user", {
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser({
            id : data.user_id,
            username: data.username,
            firstName: data.first_name,
            lastName: data.last_name,
            dob: data.date_of_birth,
            age: calculateAge(data.date_of_birth),
            email: data.email,
            description: data.description,
          });
        } else {
          console.log("Failed fetching user data");
          setUser(null);
        }
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8888/api/protected", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      });
  }, [user]);

  return (
    <>
      <div id='header' className='bg-orange-400 z-100 text-white sticky top-0 w-screen h-15 flex justify-between shadow items-center'>
        <h1 className='flex pl-5 items-center font-bold text-4xl'>JOB.SCRAPER TH</h1>
        <div className="flex flex-row gap-4 items-center text-lg pr-10">
          <Link
            to="/"
            className={`${location.pathname === "/" ? "border-b-white border-b-3 py-3.5 px-1 font-semibold" : ""}`}
          >
            โพสต์
          </Link>
          <Link
            to="/search"
            className={`${location.pathname === "/search" ? "border-b-white border-b-3 py-3.5 px-1 font-semibold" : ""}`}
          >
            ค้นหา
          </Link>

          {isAuthenticated && user ? (
            <Link
              to="/user"
              className={`${location.pathname === "/user" ? "border-b-white border-b-3 py-3.5 px-1 font-semibold" : ""}`}
            >
              {user.username}
            </Link>
          ) : null}
          {isAuthenticated ? (
            <Link to="/user/logout">ออกจากระบบ</Link>
          ) : (
            <Link 
              to="/user/login"
              className={`${location.pathname === "/user/login" ? "border-b-white border-b-3 py-3.5 px-1 font-semibold" : ""}`}
            >
              เข้าสู่ระบบ
            </Link>
          )}
          {isAuthenticated ?
              <button 
              onClick={() => setShowChat(prev => !prev)} 
              className=" bg-orange-500 px-3 py-1 rounded-lg hover:bg-orange-600 cursor-pointer"
              >
                💬 Chat
            </button>
            :
            <></>
        }

        </div>
      </div>

      <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
        <UserContext.Provider value={{ user, setUser }}>
          <Routes>
            <Route path="/search" element={<JobSearch />} />
            <Route path="/" element={<JobPost />} />        
            <Route path="/user/login" element={<LoginPage />} />
            <Route path="/user/register" element={<RegisterPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path='/user/view' element={<ViewUserPage/>}/>
            <Route path='/post/create' element={<CreatePost/>}/>
            <Route path='/post/view' element={<ViewPost/>}/>
            <Route path="/user/logout" element={<Logout />} />
          </Routes>
        </UserContext.Provider>
      </AuthContext.Provider>

      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        closeOnClick
        pauseOnHover
        theme="light"
      />

      {/* ✅ เพิ่ม Chatbot Sidebar */}
      <ChatProvider>
        <ChatSidebar isOpen={showChat} onClose={() => setShowChat(false)} />
      </ChatProvider>
    </>
  );
}

export default App;
