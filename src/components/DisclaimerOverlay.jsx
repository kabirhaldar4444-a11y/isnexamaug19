import React, { useState } from 'react';
import supabase from '../utils/supabase';

const DisclaimerOverlay = ({ user, profile }) => {
  const [disclaimerCheckbox, setDisclaimerCheckbox] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [userIP, setUserIP] = useState('Detecting...');

  React.useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (data.ip) setUserIP(data.ip);
      } catch (err) {
        console.error("Auto IP fetch failed", err);
        setUserIP('N/A (Detection Blocked)');
      }
    };
    fetchIP();
  }, []);

  const userId = user?.id || profile?.id;
  const isSessionAccepted = sessionStorage.getItem(`disclaimer_accepted_${userId}`);

  if (profile?.disclaimer_accepted === true || isSessionAccepted) {
    return null; 
  }

  const handleAccept = async () => {
    if (!disclaimerCheckbox) return;
    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ disclaimer_accepted: true })
        .eq('id', userId);

      if (error) throw error;

      sessionStorage.setItem('disclaimer_accepted_' + userId, 'true');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Error accepting disclaimer:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
      {/* Premium Ethereal Background */}
      <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-3xl" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative w-full max-w-3xl flex flex-col max-h-[92vh] bg-white rounded-[2.5rem] overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.12)] border border-slate-200 animate-slide-up">
        
        {/* Header */}
        <div className="px-8 sm:px-12 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.552 3.84 10.29 9 11.623 5.16-1.333 9-6.07 9-11.623 0-1.314-.254-2.57-.716-3.714A11.959 11.959 0 0112 2.714z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5 uppercase">Terms & Conditions</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Please read carefully</p>
            </div>
          </div>
          {/* Removed v2.4.0 Final badge */}
        </div>

        {/* Content Area */}
        <div className="px-8 sm:px-12 py-10 overflow-y-auto flex-1 custom-scrollbar selection:bg-slate-100 bg-white">
          <div className="space-y-20">
            
            {/* 01. Service Delivery Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-[10px]">01</div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Service Delivery</h3>
              </div>
              
              <div className="relative pl-10 space-y-16 border-l border-slate-100">
                {[
                  { t: "Enrollment Process", d: "Customers visit the iSuccessNode website and fill out the Enrollment Form. After form submission, Our team connects with the customer. A detailed email is shared explaining the complete process flow and fee structure. Payments may also be accepted directly through an authorized professional expert trainer account, where applicable." },
                  { t: "Process Explanation & Confirmation", d: "During the call, the team explains the course structure, learning journey, and assessment-to-certification flow. The customer then confirms their participation in the program." },
                  { t: "Fee Payment", d: "Upon successful completion of the fee payment, a GST-compliant invoice is issued within 6 hours. Pre-examination study materials are shared with the learner within 24 hours." },
                  { t: "Pre-Exam", d: "A Pre-Exam is conducted within 24–48 hours of fee payment. This exam assesses the customer’s initial understanding of the selected domain. Before the exam, the Guidance Team connects to explain the exam process." },
                  { t: "Pre-Exam Result & Pre-Board Professional Certificate", d: "Results are shared within 24–48 hours via email. A Pre-Board Professional Certificate is issued with “Under Training” mentioned." },
                  { t: "Reward Eligibility", d: "Customers scoring above 80% become eligible for a gift. One gift can be selected from four available options, which will be delivered accordingly." },
                  { t: "Self-Paced Training", d: "Access to recorded video lectures is shared within 15 days on payment. Training duration is 90–120 days." },
                  { t: "Final Exam", d: "A Final Exam is conducted between 90-120 days." },
                  { t: "Final Certificate", d: "Upon successful completion of all requirements, the Final Certificate is issued. The certificate will clearly state the status as “Certified.”" },
                  { t: "Continuous Support", d: "Throughout the entire journey, the iSuccessNode team remains in contact for guidance and support." }
                ].map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[45px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-slate-900 shadow-lg group-hover:scale-125 transition-all duration-300 ring-4 ring-white" />
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2.5">{step.t}</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.d}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 02. Terms & Conditions Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-[10px]">02</div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Terms & Conditions</h3>
              </div>
              
              <div className="space-y-12 pl-4 border-l border-slate-100">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Course Duration and Delivery</h4>
                  <div className="space-y-4 text-[13px] text-slate-500 font-medium leading-relaxed">
                    <p>The complete course will be delivered within 90 to 120 days from the date of enrollment.</p>
                    <p>After enrollment, learners will receive an Invoice, Study Materials and video lectures within 10 working days of making the payment.</p>
                    <p>A Pre-Board Exam will be scheduled 24 to 48 hours after payment, accessible via the official I-SUCESSNODE exam portal. An Initial PC Softcopy (indicating “Under Training” and course details), will be provided after going through the pre-board exam within 48 to 72 hours.</p>
                    <p>The final online exam must be attended between 90 to 120 days after enrollment.</p>
                    <p>Upon successful exam completion, the Final PC Softcopy will be emailed to the candidate, indicating “Successfully Certified”.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Training Format</h4>
                  <ul className="space-y-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                    <li className="flex gap-3"><span className="text-slate-900">•</span> No live training sessions will be provided.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Study material and training videos will be shared once only via email after the enrollment.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Training videos and study materials are non-transferable and intended solely for enrolled candidates.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Upon successful completion of the program, the certificate will be released with an abbreviation format. For an example if the course you have enrolled in "Resilience Coach Training", then "RCT" will appear on your certificate, similarly if the course name is Decision Making Mastery Training, on the certificate it will show "DMMT"</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Exam Policy</h4>
                  <ul className="space-y-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Multiple exam attempts are not permitted, for pre- board as well as final exam.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> The Final PC Softcopy will be issued within 15 days after the final exam attempt.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> No hard copy certificates will be delivered; all documents will be sent in digital format only.</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Refund Policy (Summary)</h4>
                  <ul className="space-y-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                    <li className="flex gap-3"><span className="text-slate-900 font-black">•</span> No refund will be applicable after attempting any exam (Pre-Board or Final).</li>
                    <li className="flex gap-3"><span className="text-slate-900 font-black">•</span> A 90% refund is applicable before attempting any exam.</li>
                    <li className="flex gap-3"><span className="text-slate-900 font-black">•</span> There is no 100% refund policy.</li>
                    <li className="flex gap-3"><span className="text-slate-900 font-black">•</span> A 10% deduction will apply to all refunds to cover the cost of digital study materials and content access.</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Pre-Examination Reward Policy</h4>
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-emerald-500/20">Reward Eligible</div>
                    </div>
                    <div className="space-y-6">
                      <p className="text-[13px] font-bold text-white tracking-tight leading-relaxed pr-32">Candidates who secure 80% or above in the designated pre-examination will be eligible to receive a complimentary gift worth upto 50k-100k.</p>
                      <ul className="text-[11px] text-slate-400 space-y-3 font-medium leading-relaxed">
                        <li>• Eligible candidates will be provided with 5+ options for gift items. Final selection subject to availability and company discretion.</li>
                        <li>• By qualifying, candidates consent to the use and display of their photograph on the company’s official website and promotional platforms.</li>
                        <li>• Gift items dispatched within 45 to 60 days from the date of result declaration.</li>
                        <li>• All gifts accompanied by the manufacturer’s warranty, where applicable.</li>
                        <li>• Courier tracking details shared via registered email once dispatched.</li>
                        <li>• Delivery verification (OTP) required by the courier partner will be shared with the recipient.</li>
                        <li>• The company reserves the right to modify, substitute, or discontinue the reward offer at any time without prior notice.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">General Terms</h4>
                  <ul className="space-y-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                    <li className="flex gap-3"><span className="text-slate-900">•</span> All timelines mentioned are approximate and subject to variation depending on course type and customer engagement.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Study materials and videos are shared once and cannot be reissued.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> By enrolling, candidates agree to comply with the above terms and conditions.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 03. Refund Policy Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-[10px]">03</div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Refund Policy</h3>
              </div>
              
              <div className="space-y-10 pl-4 border-l border-slate-100">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No Refund After Exam Attempt</h4>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">Once a candidate has attempted any exam — whether it is the Pre-Board Exam or the Final Exam — no refund will be applicable under any circumstances.</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed italic font-medium p-4 bg-slate-50 rounded-xl border border-slate-100/50">This policy ensures the integrity of our course access and examination system, as study materials and evaluations are already utilized at that stage.</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">90% Refund Before Exam Attempt</h4>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">If a candidate wishes to cancel their enrollment before attempting the pre-exam, they are eligible for a 90% refund of the total course fee.</p>
                  <div className="p-6 bg-slate-900 rounded-3xl shadow-xl">
                    <p className="text-white text-[10px] leading-relaxed font-black uppercase tracking-widest text-center">REFUND WILL BE ONLY BE PROVIDED IF THE CUSTOMER RAISED THE REQUEST WITHIN 24 HOURS OF MAKING THE PAYMENT AND THEY MUST NOT ATTEND THE EXAM OTHERWISE NO REFUND WILL BE INITIATED TO THEM.</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">The refund request must be raised in writing via email to the official I-SUCESSNODE support team.</p>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">Refund processing time is 5-7 working days once the refund request is approved it may take an additional 7 working days to get credited into the customer's bank account from which payment was made.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No 100% Refund Policy</h4>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">Please note that I-SUCESSNODE does not offer a 100% refund under any condition. This is due to administrative, processing, and content access costs incurred upon enrollment.</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Refund Request Procedure</h4>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">To request a refund, the candidate must email <span className="text-slate-900 font-bold">support@isuccessnode.com</span> with their full name, registered email ID, course name, payment receipt, and reason for cancellation. Requests without complete details may face delays in processing.</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">10% Deduction on All Refunds</h4>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">All approved refunds will include a 10% deduction to cover costs associated with digital content delivery, study materials, and platform usage. This deduction applies uniformly to all refund cases.</p>
                </div>

                <div className="space-y-6 pt-4">
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Special Note</h5>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { title: "Partial Course Completion", text: "If a candidate has completed only a portion of the course, no refund will be issued for the remaining content." },
                      { title: "Delayed Course Progress", text: "Refunds will not be provided due to delays in completing the course at the candidate’s own pace." },
                      { title: "Accessed Content", text: "Once study materials, training videos, or pre-board assessments have been accessed, refunds will not be applicable." },
                      { title: "Dissatisfaction", text: "Refunds cannot be claimed solely based on personal preferences, expectations, or dissatisfaction with the course material." }
                    ].map((note, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{note.title}</p>
                          <p className="text-slate-500 text-xs font-medium leading-relaxed">{note.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                   <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Agreement to Policies</h5>
                   <div className="space-y-4 text-xs text-slate-500 font-medium leading-relaxed">
                     <p>By enrolling in any course offered by I-SUCESSNODE Education, candidates acknowledge and agree to comply with all policies, terms of service, and refund rules.</p>
                     <p>Enrolling confirms that the candidate has read, understood, and accepted the terms outlined in the policies, including payment, course access, exam schedules, and refund rules.</p>
                     <p>Candidates are responsible for reviewing these policies prior to enrollment, as continued use of the course materials implies acceptance of all terms.</p>
                   </div>
                </div>

                <div className="space-y-8 pt-8">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Independent Organization</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">I-SUCCESSNODE (OPC) PVT. LTD. is an independent training and service provider. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with any other institute, organization, or governing body. All rights related to our services, content, and training materials are solely reserved by I-SUCCESSNODE.</p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">No Guarantee of Employment or Monetary Benefit</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Our programs are designed for skill development and professional enhancement only. We do not guarantee any monetary benefit, job placement, promotion, or financial gain as a result of completing our training or certification programs.</p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Third-Party Recommendations</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">I-SUCCESSNODE shall not be held responsible for any financial, personal, or professional loss incurred by customers who enroll in our services based on third-party recommendations, promotions, or representations. Any such engagement is strictly at the discretion and responsibility of the individual.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 04. Privacy Policy Section */}
            <section className="space-y-8 pb-10">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-[10px]">04</div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em]">Privacy Policy</h3>
              </div>
              
              <div className="space-y-12 pl-4 border-l border-slate-100">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Information We Collect</h4>
                  <p className="text-[13px] text-slate-500 font-medium mb-4">We collect the following types of information to ensure smooth operation of our services:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { t: "Personal Information", d: "Your name, email address, contact number, and country of residence collected during registration or inquiries." },
                      { t: "Payment Information", d: "Transaction details (amount, date, and payment method). We do not store complete payment card or crypto wallet details." },
                      { t: "Course and Usage Data", d: "Information about the courses you enroll in, your progress, assessments, and interactions with our online learning platform." },
                      { t: "Technical Information", d: "Device type, IP address, browser version, and cookies to improve website performance and user experience." }
                    ].map((info, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5">{info.t}</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{info.d}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">How We Use Your Information</h4>
                  <ul className="space-y-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Process your course enrollment and payments.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Provide access to study materials, exams, and course completion certificates.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Communicate important updates, reminders, and support-related information.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Improve course quality, website functionality, and user experience.</li>
                    <li className="flex gap-3"><span className="text-slate-900">•</span> Maintain compliance with our internal policies and applicable laws.</li>
                  </ul>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest pt-2">We do not sell, trade, or rent your personal information to any third party.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Data Storage and Security</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">All personal data is stored securely in encrypted databases. Only authorized I-SUCESSNODE personnel have access to user data. We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Payment & Financial Data</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">All personal data is stored securely in encrypted databases. Only authorized I-SUCESSNODE personnel have access to user data. We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure.</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Use of Cookies</h4>
                   <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Our website uses cookies to enhance your browsing experience, save login preferences, and analyze site traffic and improve user experience. You can choose to disable cookies from your browser settings; however, some website features may not function properly as a result.</p>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Data Retention & Third-Party Links</h4>
                   <div className="space-y-4">
                     <p className="text-[13px] text-slate-500 font-medium leading-relaxed">We retain your personal information for as long as necessary to fulfill course delivery and legal obligations. Once no longer needed, your data will be securely deleted or anonymized.</p>
                     <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Our website may contain links to third-party websites (e.g., payment gateways or educational partners). I-SUCESSNODE is not responsible for the privacy practices or content of these external sites.</p>
                   </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Your Rights</h4>
                   <p className="text-[13px] text-slate-500 font-medium leading-relaxed">You have the right to access the information we hold about you, request correction or deletion of inaccurate data, and withdraw consent for marketing communications at any time. To exercise these rights, please contact our support team at support@isuccessnode.com.</p>
                </div>

                <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200/50">
                   <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Policy Updates</h5>
                   <p className="text-[11px] text-slate-500 font-medium leading-relaxed">iSuccessNode OPC Pvt Ltd and PayG, reserves the right to update or modify this Privacy Policy at any time without prior notice. The revised version will be posted on our website with an updated effective date.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 sm:px-12 py-10 border-t border-slate-50 bg-white/90 backdrop-blur-md shrink-0 sticky bottom-0 z-20">
          <div className="flex flex-col gap-8">
            <label className="flex items-start gap-5 cursor-pointer group">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={disclaimerCheckbox}
                  onChange={(e) => setDisclaimerCheckbox(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-2 border-slate-200 checked:bg-slate-900 checked:border-slate-900 transition-all cursor-pointer appearance-none shadow-sm"
                />
                <svg className={`absolute left-1 top-1 w-4 h-4 text-white pointer-events-none transition-transform duration-300 ${disclaimerCheckbox ? 'scale-100' : 'scale-0'}`} fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 transition-colors leading-relaxed uppercase tracking-tight">
                I have read and unequivocally agree to the <span className="text-slate-900 underline underline-offset-4 decoration-2">iSuccessNode TERMS & CONDITIONS</span> and all associated identity protocols.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!disclaimerCheckbox || isAccepting}
              className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl ${disclaimerCheckbox && !isAccepting ? 'bg-slate-900 text-white shadow-slate-200 hover:-translate-y-1 active:scale-[0.98]' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
            >
              {isAccepting ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  I Agree & Continue
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="animate-pulse">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerOverlay;
