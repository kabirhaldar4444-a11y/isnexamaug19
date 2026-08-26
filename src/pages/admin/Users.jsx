import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';
import UserSubmissions from '../../components/admin/UserSubmissions';
import CreateUser from '../../components/admin/CreateUser';
import { useConfirm, useToast } from '../../components/common/AlertProvider';

const Users = ({ user, profile: activeProfile }) => {
  const confirm = useConfirm();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [docViewUrl, setDocViewUrl] = useState(null);
  const [docViewLabel, setDocViewLabel] = useState('');
  const [activeTab, setActiveTab] = useState('candidates');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const navigate = useNavigate();

  const isMaster = user?.email?.toLowerCase() === 'info@isuccessnode.com';
  const isSuperAdmin = isMaster;

  useEffect(() => {
    fetchUsers();
    fetchExams();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .order('full_name');
        
      if (!isSuperAdmin) {
        queryBuilder = queryBuilder.eq('role', 'candidate');
      }
      
      const { data, error } = await queryBuilder;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title')
        .order('title');
      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'candidate' : 'admin';
    const isConfirmed = await confirm({
      title: `${newRole === 'admin' ? 'Grant Admin Access' : 'Revoke Admin Access'}`,
      message: `Are you sure you want to ${newRole === 'admin' ? 'grant admin access to' : 'revoke admin access from'} "${targetUser.full_name}"?`,
      type: 'warning',
      confirmText: 'Yes, Change Role'
    });

    if (!isConfirmed) return;

    setTogglingId(targetUser.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUser.id);
      if (error) throw error;
      toast(`User successfully updated to ${newRole}!`, 'success');
      fetchUsers();
    } catch (error) {
      toast('Error changing role: ' + error.message, 'error');
    }
    setTogglingId(null);
  };

  const handleToggleExamLock = async (u) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_exam_locked: !u.is_exam_locked })
        .eq('id', u.id);
      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating exam lock:', error);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.email === 'info@isuccessnode.com') {
      toast('The Master Admin account cannot be deleted.', 'error');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Permanently Delete User',
      message: `Are you sure you want to delete "${targetUser.full_name}"? This will permanently remove their profile, submissions, and login access.`,
      type: 'error',
      confirmText: 'Delete Permanently'
    });
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: targetUser.id });
      if (error) throw error;
      setUsers(users.filter(u => u.id !== targetUser.id));
      toast('User deleted successfully!', 'success');
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoleUsers = users.filter(u =>
    u.role === 'admin' &&
    u.email !== 'info@isuccessnode.com' && (
      u.full_name?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(roleSearchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen relative overflow-hidden font-sans bg-slate-50/50 selection:bg-slate-100 pt-10">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-14 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">
              {isSuperAdmin ? 'Administrative Hub' : 'Candidate Directory'}
            </h1>
            <p className="text-slate-400 font-medium">
              {isSuperAdmin ? 'Orchestrate administrative nodes and identity protocols' : 'Manage candidate authorizations and assessment access'}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {activeTab === 'candidates' && (
              <div className="relative group w-full md:w-80 lg:w-96">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-slate-900 transition-colors duration-300">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search identities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900/10 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                />
              </div>
            )}
            <Link to="/admin/users/new">
              <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-[1.5rem] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center gap-3 whitespace-nowrap text-[10px] uppercase tracking-widest h-[56px]">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                New Identity
              </button>
            </Link>
          </div>
        </div>

        {/* ── TAB NAVIGATION (super admin only) ── */}
        {isSuperAdmin && (
          <div className="flex gap-2 mb-14 p-1.5 bg-white border border-slate-100 rounded-[1.5rem] w-fit shadow-sm">
            {[
              { id: 'candidates', label: 'Candidates', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
              { id: 'roles', label: 'Nodes', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── CANDIDATES TAB ── */}
        {activeTab === 'candidates' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                { label: 'Total Identities', value: users.length, icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-3.833-6.247 4.147 4.147 0 00-2.479.825 4.137 4.137 0 00-3.385-.351 4.16 4.16 0 01-.154-1.208c0-2.278 1.847-4.125 4.125-4.125S22.5 9.397 22.5 11.675a4.125 4.125 0 01-8.25 0V11.25m-1.5 7.5l-3 3m0 0l-3-3m3 3V15m1.5-12a1.5 1.5 0 00-3 0v1.125a1.5 1.5 0 01-3 0V3a1.5 1.5 0 10-3 0v1.125a1.5 1.5 0 01-3 0V3a1.5 1.5 0 10-3 0v1.125a1.5 1.5 0 01-3 0V3a1.5 1.5 0 10-3 0v1.125a1.5 1.5 0 01-3 0V3z"/></svg> },
                { label: 'Authorized Access', value: users.filter(u => !u.is_exam_locked).length, icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.548 4.075 10.14 9.5 11.04a11.99 11.99 0 009.5-11.04c0-1.305-.21-2.56-.598-3.744A11.959 11.959 0 0112 2.714z"/></svg> },
                { label: 'Administrative Nodes', value: users.filter(u => u.role === 'admin').length, icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 animate-slide-up hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    {stat.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                    <span className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full py-32 text-center">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-6 shadow-sm"></div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Directory...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No identities matching criteria</p>
                </div>
              ) : (
                filteredUsers.map((u, i) => (
                  <div
                    key={u.id}
                    className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.04)] flex flex-col gap-8 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 animate-slide-up group ${u.is_exam_locked ? 'opacity-70 saturate-[0.25]' : 'opacity-100'}`}
                    style={{ animationDelay: `${(i % 9) * 100}ms` }}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-500">
                          {u.profile_photo_url ? (
                            <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg width="24" height="24" className="text-slate-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 truncate mb-0.5">{u.full_name || 'Anonymous Object'}</h3>
                        <p className="text-xs font-bold text-slate-400 truncate tracking-tight">{u.email || 'No identity hash'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {u.role === 'admin' ? (
                        <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          Administrative Node
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {u.allotted_exam_ids?.length || 0} Assignments
                        </div>
                      )}
                      {u.is_exam_locked && (
                        <div className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-500">
                          Lockdown
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 flex items-center justify-center shadow-sm"
                          title="Inspect Identity"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => navigate(`/admin/users/service-delivery/${u.id}`)}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 flex items-center justify-center shadow-sm"
                            title="Service Delivery Milestones"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/users/edit/${u.id}`)}
                          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 flex items-center justify-center shadow-sm"
                          title="Modify Record"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-300 flex items-center justify-center shadow-sm"
                          title="Purge Object"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleExamLock(u)}
                        className={`w-10 h-10 rounded-xl transition-all duration-500 flex items-center justify-center shadow-sm ${u.is_exam_locked ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white border border-slate-100 text-slate-900 hover:bg-slate-50'}`}
                        title={u.is_exam_locked ? 'Release Lockdown' : 'Initiate Lockdown'}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          {u.is_exam_locked ? (
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          ) : (
                            <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── ADMIN ROLES TAB ── */}
        {activeTab === 'roles' && isSuperAdmin && (
          <div className="animate-fade-in">
            {/* Roles summary banner */}
            <div className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] mb-14">
              <div className="flex flex-col md:flex-row md:items-center gap-10 justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-xl shadow-slate-200">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Node Authority Protocol</h2>
                  <p className="text-sm font-medium text-slate-400 max-w-xl leading-relaxed">Modify administrative node permissions within the matrix. Confirmation is required for all state transitions.</p>
                </div>
                <div className="flex flex-wrap gap-6 items-center shrink-0">
                  <div className="flex gap-4">
                    <div className="px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                      <div className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'admin' && u.email !== 'info@isuccessnode.com').length}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Staff Nodes</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateAdmin(true)}
                    className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                    Add Node
                  </button>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative group w-full md:w-96 mb-10">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input
                type="text"
                placeholder="Locate administrative records..."
                value={roleSearchQuery}
                onChange={e => setRoleSearchQuery(e.target.value)}
                className="w-full rounded-2xl pl-12 pr-6 py-4 text-sm bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium placeholder:text-slate-300"
              />
            </div>

            {/* Role toggle list */}
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-6 shadow-sm"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Nodes...</p>
              </div>
            ) : filteredRoleUsers.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 px-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <p className="font-bold text-slate-900 text-xl mb-2">No Secondary Nodes Found</p>
                <p className="text-sm font-medium text-slate-400 mb-8">Establish a secondary administrative node to begin team orchestration.</p>
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-xl shadow-slate-200 text-[10px] uppercase tracking-widest"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                  Create Node
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRoleUsers.map((u, i) => {
                  const isAdmin = u.role === 'admin';
                  const isToggling = togglingId === u.id;

                  return (
                    <div
                      key={u.id}
                      className="bg-white px-8 py-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 animate-slide-up group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 relative">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-500">
                          {u.profile_photo_url ? (
                            <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg width="20" height="20" className="text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          )}
                        </div>
                      </div>

                      {/* Name & email */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-slate-900 truncate mb-0.5">{u.full_name || 'Authorized Object'}</h3>
                        <p className="text-xs font-bold text-slate-400 truncate tracking-tight">{u.email}</p>
                      </div>

                      {/* Role pill */}
                      <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${
                        isAdmin
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-100'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}>
                        {isAdmin ? (
                          <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Admin Node</>
                        ) : (
                          <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Candidate</>
                        )}
                      </div>

                      {/* Toggle group */}
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Node Authority</span>
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isToggling}
                          className={`relative inline-flex w-14 h-7 rounded-full items-center transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-slate-900/5 disabled:opacity-50 ${
                            isAdmin ? 'bg-slate-900 shadow-xl shadow-slate-100' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-500 ${isAdmin ? 'translate-x-7' : 'translate-x-0'}`}
                          >
                            {isToggling ? (
                              <div className="w-3 h-3 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                            ) : isAdmin ? (
                              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24" className="text-slate-900"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            ) : (
                              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24" className="text-slate-200"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CREATE ADMIN MODAL ── */}
      {showCreateAdmin && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in bg-slate-900/40 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateAdmin(false); }}
        >
          <div className="relative w-full max-w-2xl my-4 rounded-[3rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.2)] bg-white border border-slate-100 animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between px-10 py-8 bg-slate-900 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl tracking-tight leading-none">Initialize Administrative Node</h3>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Configure new high-authority account credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdmin(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 shrink-0"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-10 max-h-[75vh] overflow-y-auto bg-white">
              <CreateUser user={user} profile={activeProfile} initialRole="admin" />
            </div>
          </div>
        </div>
      )}


      {/* ── DETAIL MODAL ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl animate-fade-in bg-slate-900/40">
          <div className="w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.2)] bg-white border border-slate-100 flex flex-col overflow-hidden animate-slide-up">

            {/* ── STICKY HEADER ── */}
            <div className="flex items-center justify-between px-10 py-8 shrink-0 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm">
                    <img
                      src={selectedUser.profile_photo_url || 'https://via.placeholder.com/200'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-1">{selectedUser.full_name}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto p-10 md:p-16 space-y-16">

              {/* Personal Info */}
              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="relative shrink-0 mx-auto md:mx-0">
                  <div className="w-48 h-48 rounded-[2.5rem] bg-slate-50 border border-slate-100 p-2 shadow-sm overflow-hidden group">
                    <img
                      src={selectedUser.profile_photo_url || 'https://via.placeholder.com/200'}
                      alt=""
                      className="w-full h-full rounded-[2rem] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-xl shadow-slate-200">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Identification Data
                      </div>
                      {selectedUser.role !== 'admin' && (
                        <button
                          onClick={() => navigate(`/admin/users/service-delivery/${selectedUser.id}`)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-4 rounded-xl shadow-md shadow-emerald-100/50 hover:shadow-emerald-200/50 transition-all active:scale-[0.98] text-[9px] uppercase tracking-widest flex items-center gap-2 w-fit"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                          Service Milestones
                        </button>
                      )}
                    </div>
                    <h3 className="text-4xl font-bold tracking-tight text-slate-900">{selectedUser.full_name}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Electronic Node</p>
                      <div className="flex items-center gap-3 text-slate-900 font-bold">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
                        {selectedUser.email}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vocal Link</p>
                      <div className="flex items-center gap-3 text-slate-900 font-bold">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
                        {isSuperAdmin ? (selectedUser.phone || 'N/A') : (selectedUser.phone ? `${selectedUser.phone.slice(0, 4)}XXXXXX` : 'Restricted')}
                      </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Physical Location</p>
                       <div className="flex items-center gap-3 text-slate-900 font-bold">
                         <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                         {isSuperAdmin ? (selectedUser.address || 'Undisclosed') : 'Masked for Security'}
                       </div>
                     </div>
                     {selectedUser.ip_address && (
                       <div className="col-span-full space-y-1">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Network Node IP</p>
                         <div className="flex items-center gap-3 text-slate-900 font-bold">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" /></svg></div>
                           {isSuperAdmin ? selectedUser.ip_address : 'XXX.XXX.XXX.XXX'}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

              {/* Documents Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">Identity Artifacts</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: 'Aadhar Card (Front)', url: selectedUser.aadhaar_front_url },
                    { label: 'Aadhar Card (Back)',  url: selectedUser.aadhaar_back_url  },
                  ].map(({ label, url }) => {
                    const isPdf = url && url.toLowerCase().includes('.pdf');
                    return (
                      <div
                        key={label}
                        className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-500`}>
                              {isPdf ? (
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                              ) : (
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <p className="font-bold text-slate-900 text-sm">{label}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{url ? 'Verified Artifact' : 'Awaiting Data'}</p>
                            </div>
                          </div>
                          {url ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                          )}
                        </div>

                        {!url ? (
                          <div className="h-40 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-200">
                            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                          </div>
                        ) : !isSuperAdmin ? (
                          <div className="h-40 flex flex-col items-center justify-center bg-white rounded-3xl border border-amber-100 bg-amber-50/20 text-amber-500">
                            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Security Lockdown</p>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <button
                              onClick={() => { setDocViewLabel(label); setDocViewUrl(url); }}
                              className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98] text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                              Inspect
                            </button>
                            <a
                              href={url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-white text-slate-900 border border-slate-100 font-bold py-3.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 no-underline"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Performance Data */}
              <div className="space-y-8 pb-10">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">Analytical Metrics</h3>
                </div>
                <div className="bg-slate-50/50 rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <UserSubmissions userId={selectedUser.id} allottedExamIds={selectedUser.allotted_exam_ids || []} />
                </div>
              </div>

            </div>{/* end scrollable body */}
            
            {/* Footer */}
            <div className="p-8 border-t border-slate-50 flex justify-center bg-white shrink-0">
              <button
                onClick={() => setSelectedUser(null)}
                className="bg-slate-900 text-white font-bold py-4 px-12 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest flex items-center gap-3"
              >
                Terminate Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT VIEWER MODAL ── */}
      {docViewUrl && (
        <div
          className="fixed inset-0 z-[4000] flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in bg-slate-900/60"
          onClick={(e) => { if (e.target === e.currentTarget) setDocViewUrl(null); }}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] flex flex-col bg-white border border-slate-100 animate-slide-up">
            {/* Modal header */}
            <div className="flex items-center justify-between px-10 py-6 shrink-0 border-b border-slate-50 bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base tracking-tight">{docViewLabel}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{docViewUrl.toLowerCase().includes('.pdf') ? 'Data Payload: PDF' : 'Data Payload: VISUAL'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={docViewUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200 no-underline active:scale-95"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download
                </a>
                <button
                  onClick={() => setDocViewUrl(null)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-90"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-auto min-h-0 p-10 bg-slate-50/30">
              {docViewUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={docViewUrl}
                  title={docViewLabel}
                  className="w-full h-full rounded-2xl border border-slate-100 shadow-2xl bg-white"
                  style={{ minHeight: '65vh' }}
                />
              ) : (
                <div className="flex items-center justify-center min-h-[300px]">
                  <img
                    src={docViewUrl}
                    alt={docViewLabel}
                    className="max-w-full max-h-[70vh] rounded-[2rem] shadow-2xl object-contain border border-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
