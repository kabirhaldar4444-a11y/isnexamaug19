import React, { useState } from 'react';
import CreateUser from './CreateUser';
import ManageQuestions from './ManageQuestions';
import AdmissionsList from './AdmissionsList';
import { useConfirm } from '../common/AlertProvider';

const AdminDashboard = ({ user, profile, exams, addExam, deleteExam, onRefresh }) => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('exams');
  const isSuperAdmin = user?.email === 'info@isuccessnode.com';
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteExam = async (exam) => {
    const isConfirmed = await confirm({
      title: 'Delete Exam',
      message: `Are you sure you want to delete "${exam.title}"? This will permanently delete all questions and submissions associated with it. This action cannot be undone.`,
      type: 'error',
      confirmText: 'Delete'
    });
    if (isConfirmed) {
      await deleteExam(exam.id);
    }
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDuration) return;
    await addExam({ title: newTitle, duration: parseInt(newDuration) });
    setNewTitle('');
    setNewDuration('');
  };

  if (selectedExam) {
    return (
      <ManageQuestions
        exam={selectedExam}
        onBack={() => {
          setSelectedExam(null);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-14 font-sans selection:bg-slate-100">
      <div className="max-w-7xl mx-auto animate-fade-in">
        
        {/* Header Section */}
        <div className="mb-14 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="text-center md:text-left flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-200 mx-auto md:mx-0 shrink-0">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">Admin Dashboard</h1>
              <p className="text-slate-400 font-medium text-sm">Orchestrating examination protocols and user directories</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Modern Search Input */}
            <div className="relative group w-full md:w-80 lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-slate-900 transition-colors duration-300">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </div>
              <input 
                type="text"
                placeholder={`Search ${activeTab === 'exams' ? 'exams' : 'users'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900/10 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            
            {/* Tab Switcher */}
            <div className="flex p-1.5 bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0">
              <button
                onClick={() => { setActiveTab('exams'); setSearchQuery(''); }}
                className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${activeTab === 'exams' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                Exams
              </button>
              <button
                onClick={() => { setActiveTab('candidates'); setSearchQuery(''); }}
                className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${activeTab === 'candidates' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                Users
              </button>
              <button
                onClick={() => { setActiveTab('admissions'); setSearchQuery(''); }}
                className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${activeTab === 'admissions' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                Admissions
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Views */}
        <div className="relative">
          {activeTab === 'exams' ? (
            <div className="animate-slide-up space-y-16">
              
              {/* Creation Module */}
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] p-10 md:p-14 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                
                <div className="flex items-center gap-5 mb-10 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Exam</h3>
                </div>

                <form onSubmit={handleSubmitExam} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end relative z-10">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Exam Name</label>
                    <input
                      type="text"
                      placeholder="Enter the exam name..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900/20 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all duration-300 text-slate-900 font-bold placeholder:text-slate-300"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Time Limit (Minutes)</label>
                    <input
                      type="number"
                      placeholder="60"
                      value={newDuration}
                      min="1"
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900/20 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all duration-300 text-slate-900 font-bold placeholder:text-slate-300"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em]">
                      Create Exam
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Grid Module */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Active Exams</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Exams</span>
                    <span className="bg-white text-slate-900 border border-slate-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">{filteredExams.length} Exams</span>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredExams.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] px-10 text-center">
                      <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>
                      </div>
                      <p className="text-slate-900 font-bold text-xl mb-2">No Matching Exams</p>
                      <p className="text-slate-400 font-medium text-sm max-w-xs">Adjust your search query or create a new assessment.</p>
                    </div>
                  ) : (
                    filteredExams.map((exam, i) => (
                      <div key={exam.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.04)] p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group">
                        <div className="mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-sm">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v17.792m0-17.792l-4.5 4.5m4.5-4.5l4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <h4 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{exam.title}</h4>
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {exam.duration} Min
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Status: Active</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => setSelectedExam(exam)}
                            className="w-full bg-slate-900 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <span>Manage Questions</span>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5M4.5 20.25l7.5-7.5-7.5-7.5" /></svg>
                          </button>
                           <button
                            onClick={() => handleDeleteExam(exam)}
                            className="w-full bg-white text-rose-500 border border-rose-50 font-bold text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-2xl hover:bg-rose-50 hover:border-rose-100 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'candidates' ? (
            <div className="animate-slide-up">
              <CreateUser user={user} profile={profile} />
            </div>
          ) : activeTab === 'admissions' ? (
            <div className="animate-slide-up">
              <AdmissionsList user={user} profile={profile} />
            </div>
          ) : (
            <div className="animate-slide-up">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] p-10 md:p-14">
                <div className="mb-12 border-b border-slate-50 pb-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-xl shadow-slate-200">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-3.833-6.247 4.147 4.147 0 00-2.479.825 4.137 4.137 0 00-3.385-.351 4.16 4.16 0 01-.154-1.208c0-2.278 1.847-4.125 4.125-4.125S22.5 9.397 22.5 11.675a4.125 4.125 0 01-8.25 0V11.25m-1.5 7.5l-3 3m0 0l-3-3m3 3V15m1.5-12a1.5 1.5 0 00-3 0v1.125a1.5 1.5 0 01-3 0V3a1.5 1.5 0 10-3 0v1.125a1.5 1.5 0 01-3 0V3a1.5 1.5 0 10-3 0v1.125a1.5 1.5 0 01-3 0V3a1.5 1.5 0 10-3 0v1.125a1.5 1.5 0 01-3 0V3z" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Admin Management</h3>
                  <p className="text-slate-400 font-medium max-w-2xl text-sm leading-relaxed">Create additional admin accounts to help manage the portal. Admins can manage exams and users.</p>
                </div>
                <CreateUser user={user} profile={profile} initialRole="admin" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
