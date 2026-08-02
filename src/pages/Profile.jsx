import React from 'react';

const Profile = ({ profile }) => {
  return (
    <div className="min-h-screen bg-white p-6 md:p-12 flex items-center justify-center font-sans selection:bg-slate-200">
      <div className="w-full max-w-3xl animate-fade-in">
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] p-12 md:p-24 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
          
          {/* Avatar Section */}
          <div className="relative mb-16">
            <div className="w-44 h-44 rounded-[3.5rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-6xl font-black text-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform duration-700">
              {profile?.full_name?.charAt(0) || 'C'}
            </div>
            <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-3xl bg-emerald-500 border-4 border-white text-white flex items-center justify-center shadow-2xl animate-bounce-slow">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>

          {/* Name & Title */}
          <div className="mb-20">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
              {profile?.full_name || 'Candidate Name'}
            </h2>
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Verified Candidate
            </div>
          </div>
          
          {/* Info Details */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] space-y-3 group/item hover:bg-white hover:shadow-2xl transition-all duration-500">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover/item:text-slate-900 transition-colors">Email Address</label>
              <p className="text-lg font-bold text-slate-900 truncate">{profile?.email || 'N/A'}</p>
            </div>
            <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] space-y-3 group/item hover:bg-white hover:shadow-2xl transition-all duration-500">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover/item:text-slate-900 transition-colors">Account Role</label>
              <p className="text-lg font-bold text-slate-900 capitalize tracking-tight">{profile?.role || 'candidate'}</p>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-50 w-full text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-200">
              Powered by I-SUCCESSNODE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
