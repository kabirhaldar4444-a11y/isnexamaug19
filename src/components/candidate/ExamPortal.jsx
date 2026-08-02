import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { useToast } from '../common/AlertProvider';

const ExamPortal = ({ exam, onFinish, submitSignal, user }) => {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReEntry, setIsReEntry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [hasAcceptedDeclaration, setHasAcceptedDeclaration] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);

  // Advanced Tracking States
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [markedQuestions, setMarkedQuestions] = useState({});

  const answersRef = React.useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
    if (exam?.id) {
      localStorage.setItem(`exam_progress_${exam.id}`, JSON.stringify({
        answers,
        currentQuestionIndex,
        timeLeft,
        visitedQuestions: Array.from(visitedQuestions),
        markedQuestions
      }));
    }
  }, [answers, currentQuestionIndex, timeLeft, exam.id, visitedQuestions, markedQuestions]);

  const [confirmedSignal, setConfirmedSignal] = useState(0);

  useEffect(() => {
    if (submitSignal > 0 && submitSignal !== confirmedSignal && !isSubmitted) {
      setShowConfirm(true);
      setConfirmedSignal(submitSignal);
    }
  }, [submitSignal]);

  useEffect(() => {
    const savedProgress = localStorage.getItem(`exam_progress_${exam.id}`);
    if (savedProgress) {
      const { 
        answers: savedAnswers, 
        currentQuestionIndex: savedIndex, 
        timeLeft: savedTime,
        visitedQuestions: savedVisited,
        markedQuestions: savedMarked
      } = JSON.parse(savedProgress);
      
      if (savedAnswers) setAnswers(savedAnswers);
      if (savedIndex !== undefined) setCurrentQuestionIndex(savedIndex);
      if (savedTime !== undefined) setTimeLeft(savedTime);
      if (savedVisited) setVisitedQuestions(new Set(savedVisited));
      if (savedMarked) setMarkedQuestions(savedMarked);
    }
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    try {
      if (!user) return;

      const { data: subSnapshot, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', exam.id);
      
      if (subError) throw subError;

      if (subSnapshot && subSnapshot.length > 0) {
        setIsSubmitted(true);
        setIsReEntry(true);
        setLoading(false);
        return;
      }

      const { data: questionsList, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id);

      if (qError) throw qError;
      
      if (questionsList && questionsList.length > 0) {
        setQuestions(questionsList);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error in ExamPortal init:', err);
      toast('Failed to load examination questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      setTimeExpired(true);
      setShowConfirm(true);
      const autoSubmitTimer = setTimeout(() => {
        if (!isSubmitted) {
          setShowConfirm(false);
          handleSubmitWithAnswers(answersRef.current);
        }
      }, 3000);
      return () => clearTimeout(autoSubmitTimer);
    }
    if (isSubmitted || !hasAcceptedDeclaration) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, hasAcceptedDeclaration]);

  useEffect(() => {
    if (questions.length > 0) {
      setVisitedQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }
  }, [currentQuestionIndex, questions.length]);

  const toggleMarkForReview = () => {
    setMarkedQuestions(prev => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex]
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionSelect = (optionIdx) => {
    setAnswers({ ...answers, [currentQuestionIndex]: optionIdx });
  };

  const handleSubmitWithAnswers = async (currentAnswers) => {
    if (isSubmitted) return;
    
    let score = 0;
    questions.forEach((q, idx) => {
      if (currentAnswers[idx] === q.correct_option) score += 5;
    });
    
    if (user) {
      try {
        const { error } = await supabase
          .from('submissions')
          .insert([{
            user_id: user.id,
            exam_id: exam.id,
            score: score,
            total_questions: questions.length,
            answers: currentAnswers,
            is_released: false,
            admin_score_override: null
          }]);

        if (error) throw error;
      } catch (error) {
        toast('Error saving submission: ' + error.message, 'error');
        return;
      }
    }

    setIsSubmitted(true);
    localStorage.removeItem(`exam_progress_${exam.id}`);
    toast('Your exam has been submitted successfully!', 'success');
  };

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const confirmAndSubmit = () => {
    setShowConfirm(false);
    handleSubmitWithAnswers(answersRef.current);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
    </div>
  );

  if (!hasAcceptedDeclaration) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center font-sans selection:bg-slate-200">
        <div className="w-full max-w-4xl bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] p-10 md:p-16 animate-fade-in relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 border-b border-slate-50 pb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-200 group hover:rotate-6 transition-transform duration-500">
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase">{exam.title}</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Exam Instructions</p>
              </div>
            </div>
            
            <div className="flex p-3 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
              <div className="px-6 py-2 text-center border-r border-slate-200">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Limit</p>
                <p className="text-lg font-black text-slate-900">{exam.duration}m</p>
              </div>
              <div className="px-6 py-2 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Questions</p>
                <p className="text-lg font-black text-slate-900">{questions.length}</p>
              </div>
            </div>
          </div>

          {/* Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-slate-900 shadow-[0_0_8px_rgba(15,23,42,0.4)]" />
                Guidelines
              </h3>
              <div className="space-y-6">
                {[
                  'Maintain high-speed connectivity throughout.',
                  'System auto-submits on timer expiration.',
                  'Refreshing or tab-switching is strictly prohibited.',
                  'Results are subject to administrative audit.'
                ].map((text, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 font-black text-[10px] group-hover:bg-slate-900 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed group-hover:text-slate-900 transition-colors">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                Scoring
              </h3>
              <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100 space-y-6 shadow-inner">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-50 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Correct Response</span>
                  <div className="px-4 py-1.5 bg-emerald-50 rounded-lg text-emerald-600 text-xs font-black">+5.0</div>
                </div>
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-50 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Negative Marking</span>
                  <div className="px-4 py-1.5 bg-slate-50 rounded-lg text-slate-400 text-xs font-black">0.0</div>
                </div>
              </div>
            </div>
          </div>

          {/* Declaration Section */}
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-16 border border-slate-800 shadow-[0_48px_96px_-24px_rgba(15,23,42,0.4)] text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl" />
            
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 relative z-10">Verification & Acknowledgement</h4>
            <p className="text-2xl font-bold text-white leading-tight mb-14 italic relative z-10">
              "I unequivocally declare that I shall conduct myself with professional integrity and complete this assessment independently."
            </p>

            <div className="flex flex-col items-center gap-10 relative z-10">
              <label className="flex items-center gap-5 cursor-pointer group/label">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={acceptedCheckbox}
                    onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                    className="w-8 h-8 rounded-xl border-2 border-slate-700 bg-transparent text-white focus:ring-0 transition-all cursor-pointer appearance-none checked:bg-white checked:border-white"
                  />
                  {acceptedCheckbox && (
                    <svg className="absolute top-1.5 left-1.5 w-5 h-5 text-slate-900 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover/label:text-white transition-colors">
                  I Accept All Terms & Protocols
                </span>
              </label>

              <button
                disabled={!acceptedCheckbox}
                onClick={() => setHasAcceptedDeclaration(true)}
                className={`w-full max-w-sm py-6 rounded-2xl font-black tracking-[0.3em] flex items-center justify-center gap-4 transition-all duration-500 uppercase text-[10px] ${acceptedCheckbox ? 'bg-white text-slate-900 shadow-2xl hover:-translate-y-2 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                Start Exam
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className={acceptedCheckbox ? 'animate-pulse' : ''}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Result/Submit Views ── */
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] p-12 md:p-20 text-center max-w-2xl w-full animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          
          <div className="w-28 h-28 mx-auto bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-12 shadow-2xl shadow-emerald-50 group hover:scale-110 transition-transform duration-500">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-6 uppercase">Exam Submitted</h2>
          <p className="text-slate-500 font-bold text-lg leading-relaxed mb-12">
            Your exam has been submitted successfully. You can check your results on the dashboard once they are released.
          </p>
          
          <button 
            onClick={onFinish} 
            className="w-full py-6 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-800 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.3)] transition-all active:scale-[0.98] hover:-translate-y-1"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-12 md:p-16 text-center max-w-xl w-full animate-fade-in">
          <div className="w-24 h-24 mx-auto bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mb-10 shadow-lg shadow-amber-50">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">No Questions Found</h2>
          <p className="text-slate-500 font-bold mb-12">This exam currently has no questions. Please contact your administrator.</p>
          <button 
            onClick={onFinish} 
            className="w-full py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const QuestionNumber = ({ idx, isActive, isAnswered, isVisited, isMarked, onClick }) => {
    let shapeClass = "rounded-lg"; // Default (Not Visited)
    let colorClass = "bg-slate-50 text-slate-400 border-slate-200";
    let statusIcon = null;

    if (isMarked) {
      shapeClass = "rounded-full"; // Circle for Marked
      colorClass = isAnswered 
        ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200" 
        : "bg-purple-100 text-purple-700 border-purple-200";
      
      if (isAnswered) {
        statusIcon = (
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-sm border-2 border-white flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      }
    } else if (isAnswered) {
      // Pentagon
      shapeClass = "[clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)]";
      colorClass = "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200";
    } else if (isVisited) {
      // Hexagon
      shapeClass = "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]";
      colorClass = "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200";
    }

    if (isActive) {
      colorClass = "bg-slate-900 text-white border-slate-900 shadow-2xl ring-4 ring-slate-100 scale-110 z-10";
    }

    return (
      <button 
        onClick={onClick}
        className={`relative w-10 h-10 flex items-center justify-center font-black text-xs transition-all duration-300 border-2 ${shapeClass} ${colorClass}`}
      >
        {idx + 1}
        {statusIcon}
      </button>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-slate-200 flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pointer-events-none" />
      
      {/* Modal Overlays */}
      {showConfirm && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-10 max-w-md w-full shadow-2xl text-center animate-slide-up">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${timeExpired ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">{timeExpired ? "Time's Up!" : 'Submit Exam?'}</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">
              {timeExpired ? 'Your session has ended. Your answers will be submitted automatically.' : 'Are you sure you want to finish? You cannot change your answers after submission.'}
            </p>
            <div className="flex gap-4">
              {!timeExpired && (
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 px-6 rounded-xl font-bold text-slate-500 border border-slate-100 hover:bg-slate-50 transition-all">Cancel</button>
              )}
              <button onClick={confirmAndSubmit} className="flex-1 py-4 px-6 rounded-xl font-bold bg-slate-900 text-white shadow-xl shadow-slate-200 transition-all">Submit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Info & Timer Bar */}
      <div className="w-full flex items-center justify-between px-8 pt-6 pb-2 z-[1000] shrink-0">
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-slate-100 flex items-center justify-center transition-all group-hover:rotate-3">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-slate-900"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.086c-2.358-1.2-4.857-1.75-7.5-1.75s-5.142.55-7.5 1.75v13.914c2.358-1.2 4.857-1.75 7.5-1.75s5.142.55 7.5 1.75m0-13.914c2.358-1.2 4.857-1.75 7.5-1.75s5.142.55 7.5 1.75v13.914c-2.358-1.2-4.857-1.75-7.5-1.75s-5.142.55-7.5 1.75" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-0.5">Live Assessment</p>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase line-clamp-1 max-w-[250px] md:max-w-md">{exam.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white shadow-lg shadow-slate-100">
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hidden sm:block">Time Left</p>
            <div className={`text-xl font-black flex items-center gap-2 tabular-nums ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-row gap-6 px-8 pb-6 overflow-hidden min-h-0">
        
        {/* Question View */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl shadow-slate-200/40 p-6 md:p-10 flex flex-col relative overflow-hidden transition-all duration-500">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/30 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Question</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black shadow-lg shadow-slate-200 text-sm">
                    {currentQuestionIndex + 1}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ {questions.length}</span>
                </div>
              </div>
              
              <div className="flex-1 max-w-[200px] h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 animate-slide-up" key={currentQuestionIndex}>
              <div className="flex gap-4 mb-6">
                <div className="w-1 h-6 bg-slate-900 rounded-full shrink-0 shadow-[0_0_12px_rgba(15,23,42,0.3)] mt-1" />
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug tracking-tight">
                  {currentQuestion.question_text}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5 max-w-4xl pb-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestionIndex] === idx;
                  return (
                    <label 
                      key={idx} 
                      className={`group relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-500 flex items-center gap-4 ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-200/50 scale-[1.01]' 
                          : 'border-white bg-white/60 hover:border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <input type="radio" name="option" value={idx} checked={isSelected} onChange={() => handleOptionSelect(idx)} className="sr-only" />
                      <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 font-black text-[10px] transition-all duration-500 ${
                        isSelected ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-400 group-hover:border-slate-900 group-hover:text-slate-900'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-[13px] sm:text-sm font-semibold leading-snug">{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 pt-4 border-t border-slate-200/30 flex justify-between items-center gap-4 shrink-0">
              <div className="flex gap-2">
                <button 
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all disabled:opacity-0 flex items-center gap-1.5"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                  Prev
                </button>
                <button 
                  onClick={toggleMarkForReview}
                  className={`px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 border-2 ${
                    markedQuestions[currentQuestionIndex] 
                      ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                      : 'bg-white/60 border-white text-slate-400 hover:border-purple-200 hover:text-purple-500'
                  }`}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                  {markedQuestions[currentQuestionIndex] ? 'Unmark' : 'Review'}
                </button>
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button onClick={handleSubmit} className="px-8 py-2.5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-emerald-700 shadow-md transition-all">
                  Finish Exam
                </button>
              ) : (
                <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="px-8 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-800 shadow-md transition-all flex items-center gap-1.5">
                  Next
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stable Question Map Sidebar */}
        <aside className="w-[280px] shrink-0 flex flex-col min-h-0">
          <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl shadow-slate-200/40 p-6 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/30">
              <h4 className="text-base font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="text-slate-300"><path d="M4 6h16M4 12h16m-7 6h7" /></svg>
                Map
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, idx) => (
                  <QuestionNumber 
                    key={idx}
                    idx={idx}
                    isActive={currentQuestionIndex === idx}
                    isAnswered={answers[idx] !== undefined}
                    isVisited={visitedQuestions.has(idx)}
                    isMarked={markedQuestions[idx]}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Legend & Stats */}
            <div className="space-y-2 pt-6 border-t border-slate-200/30 shrink-0">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Not Visited', count: questions.length - visitedQuestions.size, color: 'bg-white', shape: 'rounded-md' },
                  { label: 'Not Answered', count: visitedQuestions.size - Object.keys(answers).length, color: 'bg-orange-500', shape: '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]' },
                  { label: 'Answered', count: Object.keys(answers).length, color: 'bg-emerald-500', shape: '[clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)]' },
                  { label: 'Reviewed', count: Object.keys(markedQuestions).filter(k => markedQuestions[k]).length, color: 'bg-purple-600', shape: 'rounded-full' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 border border-white/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${item.shape} ${item.color} ${item.color === 'bg-white' ? 'border border-slate-200' : ''}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ExamPortal;

