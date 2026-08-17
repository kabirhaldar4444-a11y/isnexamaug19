import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ isAdmin, isCandidate, onLogout, isExamActive, onSubmitExam }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  
  const navLinkClass = (path) => `
    relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
    ${location.pathname === path 
      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
  `;

  return (
    <div className="w-full flex justify-center pt-6 pb-2 px-4 sticky top-0 z-[1000]">
      <header className="px-6 md:px-8 h-18 flex items-center bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] w-full max-w-6xl transition-all duration-300">
        <div className="flex items-center justify-between w-full">
          {/* Left Section: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center group transition-transform duration-300 hover:scale-[1.02]">
              <img src="/logo_full.png" alt="iSuccessNode" className="h-8 object-contain" />
            </Link>
          </div>

          {/* Center Section: Navigation (Hidden during exam) */}
          <nav className="hidden md:flex justify-center items-center gap-2">
            {!isExamActive && isAdminRoute && (
              <>
                <Link to="/admin" className={navLinkClass('/admin')}>
                  Exams
                </Link>
                <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                  Users
                </Link>
              </>
            )}

            {!isExamActive && isCandidate && !isAdminRoute && (
              <>
                <Link to="/" className={navLinkClass('/')}>
                  My Exams
                </Link>
                <Link to="/servicedelivery" className={navLinkClass('/servicedelivery')}>
                  Service Delivery
                </Link>
                <Link to="/profile" className={navLinkClass('/profile')}>
                  Profile
                </Link>
              </>
            )}
          </nav>

          {/* Right Section: Actions */}
          <div className="flex-1 flex justify-end gap-3 items-center">
            {isExamActive ? (
              <button 
                onClick={onSubmitExam} 
                className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-2xl text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all duration-300 flex items-center gap-2 uppercase tracking-wider"
              >
                Submit Exam
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </button>
            ) : (isAdmin || isCandidate) ? (
              <button 
                onClick={() => { onLogout(); navigate('/'); }} 
                className="bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-2xl text-xs hover:bg-slate-100 transition-all duration-300 border border-slate-100"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-4 items-center">
                <Link to="/login" className="text-slate-400 hover:text-slate-900 font-bold text-xs transition-colors">Login</Link>
                <Link to="/admin/login" className="bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">Admin Login</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
