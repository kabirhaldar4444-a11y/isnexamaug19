import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { useToast, useConfirm } from '../common/AlertProvider';

const AdmissionsList = ({ user, profile, searchQuery = '' }) => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmissions(data || []);
    } catch (err) {
      console.error('Error fetching admissions:', err);
      toast('Failed to fetch admissions. Please run the SQL script to create the table.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleAcceptClick = (admission) => {
    setSelectedAdmission(admission);
    generatePassword();
    setShowPasswordModal(true);
  };

  const confirmAccept = async () => {
    if (!password) return toast('Please generate or enter a password.', 'warning');
    
    setProcessingId(selectedAdmission.id);
    setShowPasswordModal(false);

    try {
      const { error } = await supabase.rpc('admin_accept_admission', {
        p_admission_id: selectedAdmission.id,
        p_password: password
      });

      if (error) throw error;

      toast(`Admission for ${selectedAdmission.full_name} accepted and user created!`, 'success');
      
      // Optionally show the password to the admin so they can email it to the user.
      alert(`User Created!\nEmail: ${selectedAdmission.email}\nPassword: ${password}\n\nPlease share this password securely with the user.`);
      
      fetchAdmissions();
    } catch (err) {
      console.error('Error accepting admission:', err);
      toast(err.message || 'Failed to accept admission.', 'error');
    } finally {
      setProcessingId(null);
      setSelectedAdmission(null);
    }
  };

  const handleRejectClick = async (admission) => {
    const isConfirmed = await confirm({
      title: 'Reject Admission',
      message: `Are you sure you want to reject the admission for "${admission.full_name}"? This action cannot be undone.`,
      type: 'error',
      confirmText: 'Reject'
    });
    
    if (isConfirmed) {
      setProcessingId(admission.id);
      try {
        const { error } = await supabase
          .from('admissions')
          .update({ status: 'rejected' })
          .eq('id', admission.id);
          
        if (error) throw error;
        toast('Admission rejected successfully.', 'success');
        fetchAdmissions();
      } catch (err) {
        console.error('Error rejecting admission:', err);
        toast('Failed to reject admission.', 'error');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const filteredAdmissions = admissions.filter(a => 
    (a.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading admissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">New Admissions</h2>
          <p className="text-sm text-slate-500">Review and accept pending candidate admission forms.</p>
        </div>
        <button 
          onClick={fetchAdmissions}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          title="Refresh List"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {filteredAdmissions.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Pending Admissions</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">When candidates submit the public admission form, they will appear here for your review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAdmissions.map(admission => (
            <div key={admission.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              
              <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between relative z-10">
                <div className="flex gap-5">
                  <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md">
                    {admission.profile_photo_url ? (
                      <video src={admission.profile_photo_url} className="w-full h-full object-cover" controlsList="nodownload nofullscreen noremoteplayback" disablePictureInPicture />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{admission.full_name}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-3">{admission.email} • {admission.phone}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                      <div><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Course</span> {admission.course_name || 'N/A'}</div>
                      <div><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Location</span> {admission.city}, {admission.state}</div>
                      <div className="sm:col-span-2"><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Address</span> {admission.address} - {admission.pincode}</div>
                      <div><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Submitted</span> {new Date(admission.created_at).toLocaleDateString()}</div>
                      <div><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">IP Address</span> <code className="text-xs bg-slate-100 px-1 rounded">{admission.ip_address}</code></div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {admission.profile_photo_url && <a href={admission.profile_photo_url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors">Video</a>}
                      {admission.aadhaar_front_url && <a href={admission.aadhaar_front_url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Aadhaar (F)</a>}
                      {admission.aadhaar_back_url && <a href={admission.aadhaar_back_url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Aadhaar (B)</a>}
                      {admission.pan_url && <a href={admission.pan_url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">PAN Card</a>}
                      {admission.signature_url && <a href={admission.signature_url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Signature</a>}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center self-start md:self-center w-full md:w-auto mt-4 md:mt-0 gap-3">
                  <button
                    onClick={() => handleAcceptClick(admission)}
                    disabled={processingId === admission.id}
                    className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === admission.id ? (
                      <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Accept & Create User</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectClick(admission)}
                    disabled={processingId === admission.id}
                    className="w-full md:w-auto bg-white text-rose-500 border border-rose-100 px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedAdmission && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Create Candidate Account</h3>
            <p className="text-sm text-slate-500 mb-6">Set a password for <span className="font-semibold text-slate-900">{selectedAdmission.full_name}</span>. They will use this password to log in.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Password</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 pr-12 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                  <button 
                    onClick={generatePassword}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all"
                    title="Generate Password"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAccept}
                className="flex-[2] py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-200"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsList;
