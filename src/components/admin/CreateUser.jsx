import React, { useState } from 'react';
import { useToast } from '../common/AlertProvider';
import supabase from '../../utils/supabase';

const CreateUser = ({ user, profile, initialRole = 'candidate' }) => {
  const toast = useToast();
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [role, setRole] = useState(initialRole);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSuperAdmin = user?.email === 'info@isuccessnode.com';
  
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCandidatePassword(pass);
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Trim values for consistency
    const emailToCreate = candidateEmail.trim().toLowerCase();
    const nameToCreate = candidateName.trim();
    const passwordToCreate = candidatePassword.trim();

    if (!emailToCreate || !nameToCreate || !passwordToCreate) {
      toast('Please fill all required fields.', 'warning');
      setIsCreating(false);
      return;
    }
    
    try {
      const { data: newUserId, error: rpcError } = await supabase.rpc('admin_create_candidate', {
        candidate_email: emailToCreate,
        candidate_password: passwordToCreate,
        candidate_name: nameToCreate
      });

      if (rpcError) throw rpcError;

      if (role === 'admin' && newUserId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', profile_completed: true })
          .eq('id', newUserId);
          
        if (updateError) throw updateError;
      }

      toast(`${role === 'admin' ? 'Administrative' : 'Candidate'} account created successfully!`, 'success');
      setCandidateEmail('');
      setCandidatePassword('');
      setCandidateName('');
    } catch (err) {
      console.error('Failed to create user:', err);
      toast(err.message || "Failed to create user account.", 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-user-page w-full flex flex-col items-center font-sans selection:bg-slate-100">
      <div className="bg-white w-full max-w-2xl p-8 md:p-14 rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden group">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700" />

        <div className="mb-12 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-xl shadow-slate-200">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5l-10.5 10.5-4.5-4.5" /></svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            {role === 'admin' ? 'Network Provisioning' : 'Identity Creation'}
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {role === 'admin' ? 'Establish administrative node' : 'Initialize candidate profile'}
          </p>
        </div>
        
        <form autoComplete="off" onSubmit={handleCreateCandidate} className="space-y-6 relative z-10">
          {/* Role Selection (Only for Super Admin) */}
          {isSuperAdmin && !initialRole && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-slate-400">Account Role</label>
              <div className="relative">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 text-sm font-bold appearance-none cursor-pointer"
                >
                  <option value="candidate">Student/Candidate</option>
                  <option value="admin">Staff Administrator</option>
                </select>
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-slate-400">Email Address</label>
            <div className="relative group/field">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/field:text-slate-900 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <input 
                type="email" 
                placeholder="user@isuccessnode.com" 
                value={candidateEmail}
                autoComplete="off"
                data-lpignore="true"
                onChange={(e) => setCandidateEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-slate-400">Legal Name</label>
            <div className="relative group/field">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/field:text-slate-900 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={candidateName}
                autoComplete="off"
                data-lpignore="true"
                onChange={(e) => setCandidateName(e.target.value)}
                required 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-2 text-slate-400">Security Credentials</label>
            <div className="relative group/field">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within/field:text-slate-900 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Secure access token..." 
                value={candidatePassword}
                autoComplete="new-password"
                data-lpignore="true"
                onChange={(e) => setCandidatePassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-24 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 text-sm font-medium"
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={generatePassword}
                  className="w-9 h-9 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                  title="Generate Token"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-9 h-9 rounded-xl hover:bg-white text-slate-400 hover:text-slate-900 transition-all"
                  title={showPassword ? "Mask Password" : "Reveal Password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 mt-4 border-t border-slate-50">
            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 tracking-[0.2em] text-[10px] uppercase" 
              disabled={isCreating}
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Commit {role === 'admin' ? 'Staff' : 'Student'} Profile</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
