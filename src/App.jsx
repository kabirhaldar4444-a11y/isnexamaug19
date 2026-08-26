import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import AdminDashboard from './components/admin/AdminDashboard';
import CandidateDashboard from './components/candidate/CandidateDashboard';
import ExamPortal from './components/candidate/ExamPortal';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Users from './pages/admin/Users';
import CreateUser from './components/admin/CreateUser';
import EditUser from './components/admin/EditUser';
import CompleteProfile from './pages/candidate/CompleteProfile';
import Admission from './pages/Admission';
import Recovery from './pages/Recovery';
import ServiceDeliveryManager from './pages/admin/ServiceDeliveryManager';
import supabase from './utils/supabase';
import { useToast } from './components/common/AlertProvider';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const validateUser = async (supabaseUser) => {
    try {
      if (!supabaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error || !data) {
        console.error('Session validation failed: profile not found', error);
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setProfile(null);
      } else {
        setUser(supabaseUser);
        setProfile(data);
      }
    } catch (err) {
      console.error('Auth Guard Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      validateUser(session?.user ?? null);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        validateUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // REALTIME: Listen for profile changes (exam allotment, role changes, etc.)
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkAuth = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      validateUser(currentUser);
    }
  };

  useEffect(() => {
    if (user) fetchExams();
  }, [user, profile?.profile_completed]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error('Fetch Exams Exception:', err);
    }
  };

  const addExam = async (newExam) => {
    try {
      const { error } = await supabase
        .from('exams')
        .insert([{
          title: newExam.title,
          duration: newExam.duration
        }]);
      if (error) throw error;
      toast('Exam created successfully', 'success');
      fetchExams();
    } catch (err) {
      console.error('Add Exam Exception:', err);
      toast('Failed to reach the database. Please try again.', 'error');
    }
  };

  const deleteExam = async (id) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast('Exam deleted successfully', 'success');
      fetchExams();
    } catch (err) {
      console.error('Delete Exam Exception:', err);
      const isForeignKeyError = err.message?.includes('foreign key') || err.details?.includes('referenced');
      if (isForeignKeyError) {
        toast('Cannot delete exam: it has active student submissions. Apply FIX_EXAM_DELETION.sql in Supabase to enable cascading deletes.', 'error');
      } else {
        toast(err.message || 'Failed to delete exam. Connection issue.', 'error');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setProfile(null);
    navigate('/login');
  };

  const [submitSignal, setSubmitSignal] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const isLoginRoute = location.pathname === '/login' || location.pathname === '/complete-profile' || location.pathname === '/admission';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans">
      <div className="flex flex-col items-center gap-8">
        <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin shadow-2xl shadow-slate-100"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50/30">
      {!isLoginRoute && (
        <Header 
          isAdmin={profile?.role === 'admin'} 
          isCandidate={profile?.role === 'candidate'}
          isExamActive={!!activeExam}
          onLogout={handleLogout}
          onSubmitExam={() => setSubmitSignal(prev => prev + 1)}
        />
      )}
      <main className={isLoginRoute ? 'p-0 max-w-none' : ''}>
        <Routes>
          <Route path="/admission" element={<Admission />} />
          <Route path="/login" element={
            user ? (
              !loading && !profile ? (
                <div className="flex flex-col items-center justify-center min-h-screen gap-10 text-center px-6 animate-fade-in bg-white">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 text-rose-500 flex items-center justify-center shadow-2xl shadow-rose-50">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Profile Not Found</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto">We couldn't find your profile. Please contact support.</p>
                  </div>
                  <button onClick={handleLogout} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-slate-800 shadow-2xl shadow-slate-200">Logout</button>
                </div>
              ) : (
                profile?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/" />
              )
            ) : <Login onLoginSuccess={checkAuth} />
          } />
          
          <Route path="/" element={
            !user ? <Navigate to="/login" /> :
            profile?.role === 'candidate' ? (
              activeExam ? (
                <ExamPortal exam={activeExam} onFinish={() => setActiveExam(null)} submitSignal={submitSignal} user={user} />
              ) : (
                <CandidateDashboard exams={exams} onStartExam={setActiveExam} profile={profile} user={user} />
              )
            ) : profile?.role === 'admin' ? <Navigate to="/admin" /> : (
              <div className="flex flex-col items-center justify-center min-h-screen gap-10 text-center px-6 animate-fade-in bg-white">
                <div className="w-24 h-24 rounded-[2.5rem] bg-amber-50 text-amber-500 flex items-center justify-center shadow-2xl shadow-amber-50">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Account Error</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto">There was an error with your account. Please try logging in again.</p>
                </div>
                <button onClick={handleLogout} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-slate-800 shadow-2xl shadow-slate-200">Logout</button>
              </div>
            )
          } />

          <Route path="/complete-profile" element={<Navigate to="/" />} />

          <Route path="/recovery" element={<Recovery />} />

          <Route path="/profile" element={
            profile?.role === 'candidate' ? (
              <Profile profile={profile} />
            ) : <Navigate to="/login" />
          } />
          <Route path="/admin" element={
            profile?.role === 'admin' ? (
              <AdminDashboard user={user} profile={profile} exams={exams} addExam={addExam} deleteExam={deleteExam} onRefresh={fetchExams} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users" element={
            profile?.role === 'admin' ? (
              <Users user={user} profile={profile} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users/new" element={
            profile?.role === 'admin' ? (
              <CreateUser />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users/edit/:id" element={
            profile?.role === 'admin' ? (
              <EditUser user={user} profile={profile} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin/users/service-delivery/:id" element={
            profile?.role === 'admin' ? (
              <ServiceDeliveryManager user={user} profile={profile} />
            ) : <Navigate to="/login" />
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;
