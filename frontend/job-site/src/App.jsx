import { Routes, Route, Link, useLocation } from 'react-router-dom';
import JobSearch from './components/job_search/JobSearch';
import LoginPage from './components/users/LoginPage';
import RegisterPage from './components/users/RegisterPage';
import UserPage from './components/users/UserPage';
import ViewUserPage from './components/users/ViewUserPage';
import Logout from './components/users/Logout';
import { ToastContainer } from 'react-toastify';
import { useEffect, useState, createContext } from 'react';
import calculateAge from "./utils/CalculateAge";
import { GO_API } from './utils/api';
import { FaCodeBranch, FaUser, FaSignOutAlt , FaSignInAlt } from 'react-icons/fa';

import JobMatcher from './components/job_matcher/JobMatcher';

export const AuthContext = createContext();
export const UserContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); // ✅ เพิ่มสำหรับ Loading

  const location = useLocation();
  
  useEffect(() => {
    fetch(`${GO_API}/user`, {
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
            interested_job: data.interested_job,
            cv: data.cv,
          });
        } else {
          setUser(null);
        }
      })
      .finally(() => {
        setIsLoading(false); // ✅ โหลดเสร็จ
      });
  }, []);

  useEffect(() => {
    fetch(`${GO_API}/protected`, { credentials: "include" })
      .then(async (res) => {
        setIsAuthenticated(res.ok);
      });
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-white">
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div id='header' className='bg-orange-400 z-50 text-white sticky top-0 w-full h-16 flex justify-between items-center shadow'>
      {/* Logo */}
      <h1 className='pl-6 font-extrabold text-3xl tracking-tight'>
        JOB.SCRAPER TH
      </h1>

      {/* Navigation */}
      <div className="flex flex-row gap-6 items-center text-base pr-8 h-full">

        {/* Match */}
        <Link
          to="/"
          className={`h-full flex items-center gap-2 px-2 hover:text-orange-50
            ${location.pathname === "/" ? "border-b-2 border-white font-bold" : "opacity-90"}`}
        >
          <FaCodeBranch />
          Match
        </Link>

        {/* User */}
        {isAuthenticated && user && (
          <Link
            to="/user"
            className={`h-full flex items-center gap-2 px-2 hover:text-orange-50
              ${location.pathname === "/user" ? "border-b-2 border-white font-bold" : "opacity-90"}`}
          >
            <FaUser />
            {user.username}
          </Link>
        )}

        {/* Auth */}
        {isAuthenticated && user ? (
          <Link
            to="/user/logout"
            className="flex items-center gap-2 opacity-80 hover:opacity-100 hover:underline text-sm pl-4 border-l-4 border-white/30"
          >
            <FaSignOutAlt  />
            ออกจากระบบ
          </Link>
        ) : (
          <Link
            to="/user/login"
            className={`h-full flex items-center gap-2 px-2 hover:text-orange-50
              ${location.pathname === "/user/login" ? "border-b-2 border-white font-bold" : "opacity-90"}`}
          >
            <FaSignInAlt />
            เข้าสู่ระบบ
          </Link>
        )}

      </div>
    </div>

      <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
        <UserContext.Provider value={{ user, setUser }}>
          <Routes>
            <Route path='/' element={<JobMatcher/>}/>
            <Route path="/user/login" element={<LoginPage />} />
            <Route path="/user/register" element={<RegisterPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path='/user/view' element={<ViewUserPage/>}/>
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
    </>
  );
}

export default App;
