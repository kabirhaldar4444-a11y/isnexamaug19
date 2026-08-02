import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden font-sans selection:bg-slate-200">
      
      {/* Ethereal Drift Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-100/30 rounded-full blur-[120px] animate-drift-right" style={{ '--drift-duration': '45s' }}></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[35vw] h-[35vw] bg-emerald-100/20 rounded-full blur-[100px] animate-drift-left" style={{ '--drift-duration': '55s' }}></div>
        <div className="absolute top-[40%] right-[10%] w-[25vw] h-[25vw] bg-amber-100/20 rounded-full blur-[90px] animate-drift-left" style={{ '--drift-duration': '40s' }}></div>
        <div className="absolute bottom-[10%] left-[15%] w-[30vw] h-[30vw] bg-rose-100/20 rounded-full blur-[110px] animate-drift-right" style={{ '--drift-duration': '50s' }}></div>
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-32 mb-10 transform transition-transform hover:scale-105 duration-700">
            <img src="/logo_full.png" alt="Logo" className="w-full h-auto object-contain" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 text-center uppercase">{title}</h1>
          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-[0.2em]">{subtitle}</p>
        </div>

        {children}

        {/* Footer branding */}
        <div className="mt-16 pt-8 border-t border-slate-100/50 flex flex-col items-center">
          <p className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-200">
            Powered by iSuccessNode
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
