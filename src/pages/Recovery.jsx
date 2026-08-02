import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '../utils/supabase';
import { useToast } from '../components/common/AlertProvider';
import AuthLayout from '../components/auth/AuthLayout';

const Recovery = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailParam = searchParams.get('email') || '';
  const isSuperAdmin = emailParam.trim().toLowerCase() === 'info@isuccessnode.com';

  const [targetEmail, setTargetEmail] = useState(emailParam);

  useEffect(() => {
    if (!isSuperAdmin) {
      toast('Access Denied: Master recovery is restricted to the Super Admin account.', 'error');
    }
  }, [isSuperAdmin]);

  const handleSendRecovery = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    if (!targetEmail.trim()) {
      toast('Please enter a valid target email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`
      });

      if (error) throw error;

      setSuccess(true);
      toast('Master recovery link sent successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to send master recovery link', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <AuthLayout title="Access Denied" subtitle="Security Protocol Failure">
        <div className="bg-white/80 backdrop-blur-xl border border-rose-100 rounded-3xl p-8 text-center space-y-8 shadow-2xl shadow-rose-50 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-100">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.552 3.84 10.29 9 11.623 5.16-1.333 9-6.07 9-11.623 0-1.318-.254-2.585-.716-3.73A11.959 11.959 0 0112 2.714z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Restricted Route</h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              This recovery path is exclusively reserved for the Super Admin system account.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
          >
            Return to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Master Recovery" subtitle="Super Admin Protocol">
      {!success ? (
        <form onSubmit={handleSendRecovery} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-10 space-y-10 shadow-2xl shadow-slate-100 animate-slide-up">
          
          {/* Target Identity Input Field */}
          <div className="space-y-4 group">
            <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] block ml-1 text-left">Target Identity (Email)</label>
            <div className="relative flex items-center p-4 bg-slate-50 border border-slate-100 rounded-3xl group-focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 shrink-0 mr-4">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-transparent py-1 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none transition-all duration-500"
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Confirm initiation of the password reset protocol. A magic recovery link will be sent to the secure inbox of the email address entered above.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-xl text-[10px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-12px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center min-h-[50px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
              ) : (
                'Transmit Reset Link'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 font-black py-4 rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all duration-300"
            >
              Cancel & Return
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl shadow-slate-100 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-pulse">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Transmission Complete</h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed pr-2 pl-2">
              The recovery payload has been delivered. Please check your inbox at **{targetEmail}** for validation instructions.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-xl shadow-slate-200"
          >
            Acknowledge & Close
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default Recovery;
