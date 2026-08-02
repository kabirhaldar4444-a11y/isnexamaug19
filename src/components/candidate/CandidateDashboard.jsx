import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import DisclaimerOverlay from '../DisclaimerOverlay';

const CandidateDashboard = ({ exams, onStartExam, profile, user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchSubmissions();

      const channel = supabase
        .channel('public:submissions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'submissions',
            filter: `user_id=eq.${profile.id}`
          },
          () => {
            fetchSubmissions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  const fetchSubmissions = async () => {
    setLoadingResults(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, exams(title)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching dashboard submissions:', error);
    }
    setLoadingResults(false);
  };

  const completedExamIds = submissions.map(s => s.exam_id);
  const allottedExamIds = profile?.allotted_exam_ids || [];
  const availableExams = exams.filter(e => 
    allottedExamIds.includes(e.id) && !completedExamIds.includes(e.id)
  );
  const filteredExams = availableExams.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
    <DisclaimerOverlay user={user} profile={profile} />
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans selection:bg-slate-100">
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-7 bg-slate-900 rounded-full" />
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exams</h1>
            </div>
            <p className="text-slate-400 font-medium text-sm ml-5">
              Welcome, <span className="text-slate-900">{profile?.full_name || 'Candidate'}</span>
            </p>
          </div>
          
          <div className="bg-white px-6 py-3 rounded-2xl flex items-center gap-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></div>
              </div>
              <span className="text-slate-900 font-bold text-[11px] uppercase tracking-wider">Session Active</span>
            </div>
          </div>
        </div>

        {/* Available Exams Section */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Available Exams</h2>
              {searchQuery && filteredExams.length > 0 && (
                <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                  {filteredExams.length} Found
                </span>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-slate-900 transition-colors">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-medium text-slate-900 shadow-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all outline-none placeholder:text-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExams.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[2.5rem] shadow-sm animate-fade-in">
                <p className="text-slate-400 font-medium">{searchQuery ? `No matches for "${searchQuery}"` : 'No exams available'}</p>
              </div>
            ) : (
              filteredExams.map((exam, i) => (
                <div 
                  key={exam.id} 
                  className={`bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full transition-all duration-300 group animate-slide-up ${profile?.is_exam_locked ? 'opacity-60 grayscale pointer-events-none' : 'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1.5'}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      {profile?.is_exam_locked && (
                        <div className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-500">
                          Locked
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-4 group-hover:text-slate-700 transition-colors line-clamp-2 min-h-[3rem]">{exam.title}</h3>
                    
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl mb-10 bg-slate-50 text-slate-500 group-hover:bg-slate-100 transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-bold text-[10px] uppercase tracking-wider">{exam.duration} Min</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => !profile?.is_exam_locked && onStartExam(exam)} 
                    disabled={profile?.is_exam_locked}
                    className={`w-full py-4.5 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 ${
                      profile?.is_exam_locked 
                        ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200'
                    }`}
                  >
                    {profile?.is_exam_locked ? 'Locked' : (
                      <>
                        Start Exam
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Exam History Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-xl font-bold text-slate-900">Exam History</h2>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingResults ? (
              <div className="col-span-full py-20 flex justify-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
              </div>
            ) : submissions.length === 0 ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[2.5rem] shadow-sm animate-fade-in">
                 <p className="text-slate-400 font-medium">No history records found</p>
               </div>
            ) : (
              submissions.map((sub, i) => (
                <div 
                  key={sub.id} 
                  className={`bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col transition-all duration-300 animate-slide-up hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 relative overflow-hidden group`}
                  style={{ animationDelay: `${(i % 10) * 50}ms` }}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${sub.is_released ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  
                  <div className="mb-10">
                    <h4 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-slate-700 transition-colors">
                      {sub.exams?.title}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(sub.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="space-y-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${sub.is_released ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${sub.is_released ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        {sub.is_released ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                    
                    {sub.is_released && (
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <p className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                            {sub.admin_score_override !== null ? sub.admin_score_override : sub.score}
                          </p>
                          <span className="text-[9px] font-bold text-slate-300 uppercase leading-none">/ {sub.total_questions * 5}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
    </>
  );
};

export default CandidateDashboard;
