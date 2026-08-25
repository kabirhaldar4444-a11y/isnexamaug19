import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { useToast } from '../components/common/AlertProvider';
import AuthLayout from '../components/auth/AuthLayout';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailToAuth = email.trim().toLowerCase();
    const passwordToAuth = password;

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: passwordToAuth
      });

      if (authError || !user) {
        throw new Error(authError?.message || 'Authentication failed');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error('Database access error. Account initialization incomplete.');
      }

      if (user.email === 'info@isuccessnode.com' || profile.role === 'admin') {
        await onLoginSuccess();
        toast('Login successful', 'success');
        navigate('/admin');
        return;
      }

      if (profile.role === 'candidate') {
        await onLoginSuccess();
        toast(`Welcome back, ${profile.full_name || 'Candidate'}`, 'success');
        navigate('/');
      } else {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error('Access restricted. Please contact administrator.');
      }
    } catch (err) {
      toast(err.message || 'Invalid credentials. Please verify your email and password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = () => {
    navigate(`/recovery?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthLayout 
      title="Exam Portal" 
      subtitle="Please enter your details"
    >
      <form onSubmit={handleLogin} className="space-y-12 animate-slide-up">
        <div className="space-y-4 group">
          <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] block ml-1">Email Address</label>
          <div className="relative">
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              autoComplete="off"
              className="w-full bg-transparent border-b border-slate-200 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-all duration-500"
            />
          </div>
        </div>

        <div className="space-y-4 group">
          <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] block ml-1">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              autoComplete="off"
              className="w-full bg-transparent border-b border-slate-200 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-all duration-500"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors duration-300"
            >
              {showPassword ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12.005a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>
        </div>

        {email.trim().toLowerCase() === 'info@isuccessnode.com' && (
          <div className="flex justify-end -mt-6 animate-fade-in">
            <button
              type="button"
              onClick={handleRecovery}
              className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 hover:text-blue-800 transition-all duration-300 flex items-center gap-1.5"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H3.75v-2.25A2.25 2.25 0 013 18.75V16.5h2.25v-2.25H7.5L11.25 10.5a2.25 2.25 0 011.563-.43 6 6 0 017.028-5.912z" />
              </svg>
              Request Master Recovery
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white font-black py-5 rounded-xl text-[10px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 group overflow-hidden relative"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            <>
              <span className="relative z-10 flex items-center justify-center gap-3">
                Login
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="transition-transform group-hover:translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
