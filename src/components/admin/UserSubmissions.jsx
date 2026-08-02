import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { useToast } from '../common/AlertProvider';

const SubmissionCard = ({ sub, viewDetails, handleToggleRelease, fetchSubmissions, toast }) => {
  const maxScore = sub.total_questions * 5;
  const currentSavedScore = sub.admin_score_override ?? sub.score;
  
  const [localScore, setLocalScore] = useState(currentSavedScore);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setLocalScore(prev => {
      const currentParsed = parseInt(prev);
      const isCurrentlyDirty = (prev === '') || (!isNaN(currentParsed) && currentParsed !== currentSavedScore);
      return isCurrentlyDirty ? prev : (sub.admin_score_override ?? sub.score);
    });
  }, [sub.admin_score_override, sub.score, currentSavedScore]);

  const hasOverride = sub.admin_score_override !== null && sub.admin_score_override !== sub.score;
  const currentParsed = parseInt(localScore);
  const isDirty = (localScore === '') || (!isNaN(currentParsed) && currentParsed !== currentSavedScore);

  const saveScoreToDB = async () => {
    let validScore = parseInt(localScore);
    if (isNaN(validScore)) validScore = currentSavedScore;
    if (validScore < 0) validScore = 0;
    if (validScore > maxScore) validScore = maxScore;

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ admin_score_override: validScore })
        .eq('id', sub.id);
      if (error) throw error;
      setLocalScore(validScore);
      await fetchSubmissions(); 
      toast('Score updated successfully', 'success');
    } catch (error) {
      toast(error.message, 'error');
      setLocalScore(currentSavedScore);
    }
    setIsSyncing(false);
  };

  const resetToSystemDefault = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ admin_score_override: null })
        .eq('id', sub.id);
      if (error) throw error;
      await fetchSubmissions();
      toast('Score reverted to system calculation', 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
    setIsSyncing(false);
  };

  const handleIncrement = () => {
    setLocalScore(prev => {
      const val = parseInt(prev) || 0;
      if (val >= maxScore) return maxScore;
      return val + 1;
    });
  };

  const handleDecrement = () => {
    setLocalScore(prev => {
      const val = parseInt(prev) || 0;
      if (val <= 0) return 0;
      return val - 1;
    });
  };
  
  const handleInputChange = (e) => {
    const strictVal = e.target.value.replace(/[^0-9]/g, '');
    setLocalScore(strictVal);
  };

  const handleInputBlur = () => {
    let validScore = parseInt(localScore);
    if (isNaN(validScore)) validScore = currentSavedScore;
    if (validScore < 0) validScore = 0;
    if (validScore > maxScore) validScore = maxScore;
    setLocalScore(validScore);
  };

  const isAtMin = (parseInt(localScore) || 0) <= 0;
  const isAtMax = (parseInt(localScore) || 0) >= maxScore;

  return (
    <div className={`relative bg-white p-6 rounded-3xl border transition-all duration-300 ${isDirty ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100 hover:shadow-xl hover:shadow-slate-200/40'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{sub.exams?.title}</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">Assessment Session</p>
            </div>
            {hasOverride && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-500 border border-amber-100 rounded-full">Manual Override</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 ml-14">
            <span>System Score:</span>
            <span className="text-slate-900 font-bold">{sub.score} / {maxScore}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 ml-14 md:ml-0">
          
          <div className="flex flex-col w-[160px]">
            <div className="flex justify-between items-center mb-2 px-1 h-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Final Marks</span>
              {hasOverride && !isDirty && (
                <button 
                  onClick={resetToSystemDefault}
                  disabled={isSyncing}
                  className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            
            <div className={`flex items-center bg-slate-50 border rounded-2xl p-1.5 transition-all duration-300 ${isDirty ? 'border-amber-300 bg-white ring-4 ring-amber-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
              <button 
                type="button" 
                onClick={handleDecrement} 
                disabled={isAtMin || isSyncing}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
              </button>
              
              <input 
                type="number"
                value={localScore}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={isSyncing}
                className="w-full text-center font-bold text-xl text-slate-900 bg-transparent border-none outline-none p-0 focus:text-amber-600"
              />
              
              <button 
                type="button" 
                onClick={handleIncrement} 
                disabled={isAtMax || isSyncing}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
              </button>
            </div>

            <div className={`overflow-hidden transition-all duration-300 flex absolute top-[calc(100%+8px)] left-0 right-0 z-20 ${isDirty ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="flex gap-2 w-full p-1 bg-white rounded-2xl border border-amber-100 shadow-lg shadow-amber-500/5">
                <button 
                  onClick={saveScoreToDB} 
                  disabled={isSyncing} 
                  className="flex-1 bg-slate-900 text-white rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isSyncing ? <div className="w-3 h-3 border-2 border-slate-600 border-t-white rounded-full animate-spin" /> : <span>Update</span>}
                </button>
                <button 
                  onClick={() => setLocalScore(currentSavedScore)} 
                  disabled={isSyncing} 
                  className="flex-1 bg-slate-50 text-slate-500 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => viewDetails(sub)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Analysis
            </button>
            <button 
              onClick={() => handleToggleRelease(sub.id, sub.is_released)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-xs text-white shadow-lg ${sub.is_released ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-900 shadow-slate-200'}`}
            >
              {sub.is_released ? (
                <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Released</>
              ) : (
                <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg> Publish</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserSubmissions = ({ userId, allottedExamIds = [] }) => {
  const toast = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [allottedExams, setAllottedExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [userId]);

  useEffect(() => {
    fetchAllottedExams();
  }, [allottedExamIds]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, exams(title)')
        .eq('user_id', userId);
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
    setLoading(false);
  };

  const fetchAllottedExams = async () => {
    if (!allottedExamIds || allottedExamIds.length === 0) {
      setAllottedExams([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title')
        .in('id', allottedExamIds);
      if (error) throw error;
      setAllottedExams(data || []);
    } catch (error) {
      console.error('Error fetching allotted exams:', error);
    }
  };

  const handleToggleRelease = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ is_released: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchSubmissions();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionQuestions, setSubmissionQuestions] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const viewDetails = async (sub) => {
    setSelectedSubmission(sub);
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', sub.exam_id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSubmissionQuestions(data || []);
    } catch (error) {
      console.error('Error viewing details:', error);
    }
    setDetailsLoading(false);
  };

  // Build a unified list: allotted exams merged with submission data
  const attemptedExamIds = new Set(submissions.map(s => s.exam_id));
  const pendingExams = allottedExams.filter(e => !attemptedExamIds.has(e.id));
  const hasAnyData = submissions.length > 0 || pendingExams.length > 0;

  if (loading) return <div className="py-12 text-center text-slate-400 font-medium">Loading submissions...</div>;
  if (!hasAnyData) return <div className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">No exams allotted yet.</div>;

  return (
    <div className="space-y-4">
      {submissions.map(sub => (
        <SubmissionCard
          key={sub.id}
          sub={sub}
          viewDetails={viewDetails}
          handleToggleRelease={handleToggleRelease}
          fetchSubmissions={fetchSubmissions}
          toast={toast}
        />
      ))}

      {/* Pending (not yet attempted) exams */}
      {pendingExams.map(exam => (
        <div key={exam.id} className="relative bg-white p-6 rounded-3xl border border-dashed border-slate-200 flex items-center gap-5 opacity-70">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-slate-700 leading-none">{exam.title}</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">Assessment Session</p>
          </div>
          <span className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-500 border border-amber-100 rounded-full shrink-0">Not Attempted</span>
        </div>
      ))}

      {/* Analysis Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-slide-up">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedSubmission.exams?.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Breakdown</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-900">Score: {selectedSubmission.score} / {selectedSubmission.total_questions * 5}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar selection:bg-slate-100">
              {detailsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-6"></div>
                  <p className="text-sm font-bold text-slate-900">Generating analytical breakdown...</p>
                  <p className="text-xs text-slate-400 mt-2">Retrieving candidate responses and solution keys</p>
                </div>
              ) : (
                submissionQuestions.map((q, idx) => {
                  const userAnswerIdx = selectedSubmission.answers[idx];
                  const isCorrect = userAnswerIdx === q.correct_option;
                  
                  return (
                    <div key={q.id} className="space-y-6">
                      <div className="flex items-start gap-5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm shadow-sm border ${isCorrect ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-lg font-bold text-slate-900 leading-snug mb-6">{q.question_text}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, optIdx) => {
                              const isCorrectOption = optIdx === q.correct_option;
                              const isUserAnswer = optIdx === userAnswerIdx;
                              
                              let stateClass = 'bg-slate-50 border-slate-100 text-slate-500';
                              let icon = null;

                              if (isCorrectOption) {
                                stateClass = 'bg-emerald-50 border-emerald-200 text-emerald-900 ring-2 ring-emerald-500/10';
                                icon = <svg className="text-emerald-500" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
                              } else if (isUserAnswer && !isCorrect) {
                                stateClass = 'bg-rose-50 border-rose-200 text-rose-900 ring-2 ring-rose-500/10';
                                icon = <svg className="text-rose-500" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
                              }

                              return (
                                <div key={optIdx} className={`px-5 py-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${stateClass}`}>
                                  <span className="text-sm font-bold">{opt}</span>
                                  {icon}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="mt-6 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Logic Explanation</span>
                                <div className="h-px flex-1 bg-indigo-100/50" />
                              </div>
                              <p className="text-sm text-indigo-900 leading-relaxed italic font-medium">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {idx < submissionQuestions.length - 1 && <div className="h-px bg-slate-50 w-full" />}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="px-10 py-8 border-t border-slate-50 bg-white shrink-0">
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubmissions;
