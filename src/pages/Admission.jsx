import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import SignaturePad from '../components/common/SignaturePad';

const INDIA_STATES_CITIES = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Roing", "Tezu", "Aalo", "Khonsa"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah", "Begusarai", "Chhapra", "Katihar", "Munger"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Ambikapur", "Raigarh", "Chirmiri"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Canacona", "Pernem"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Morbi"],
  "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamsala", "Kullu", "Hamirpur", "Chamba", "Una", "Bilaspur", "Nahan"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Phusro", "Medininagar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kottayam", "Kannur"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Ratlam", "Satna", "Dewas", "Murwara"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Navi Mumbai", "Kolhapur"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Senapati", "Chandel", "Tamenglong", "Jiribam", "Moreh"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Williamnagar", "Resubelpara", "Nongstoin", "Mairang", "Khliehriat"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Hnahthial", "Khawzawl"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Longleng", "Kiphire"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Rangpo", "Jorethang", "Nayabazar", "Singtam", "Ravangla", "Yuksom"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Dindigul"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Khowai", "Ambassa", "Sonamura", "Sabroom", "Teliamura"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar", "Ramnagar", "Mussoorie"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"],
  "Andaman and Nicobar Islands": ["Port Blair", "Car Nicobar", "Little Andaman", "Diglipur", "Rangat", "Mayabunder", "Ferrargunj", "Prothrapur", "Nancowrie", "Campbell Bay"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "Central Delhi", "East Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Poonch", "Leh", "Kargil"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Andrott", "Kadmat"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};

const STATES = Object.keys(INDIA_STATES_CITIES);

const FilePreview = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;
  return (
    <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden z-0">
      <img 
        src={previewUrl} 
        alt="Preview" 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 backdrop-blur-sm px-4 py-2 text-left flex items-center justify-between gap-2 z-10">
        <span className="text-[9px] font-bold text-white truncate max-w-[80%]">{file.name}</span>
        <div className="text-emerald-400 shrink-0">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 01.414 0z" clipRule="evenodd" /></svg>
        </div>
      </div>
    </div>
  );
};

const Admission = () => {
  const [step, setStep] = useState(1); // 1 = Initial Form, 2 = KYC Form, 3 = Success

  // Initial Details State
  const [fullName, setFullName] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [courseName, setCourseName] = useState('');

  // KYC State
  const [pincode, setPincode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [panCard, setPanCard] = useState(null);
  const [signatureBlob, setSignatureBlob] = useState(null);
  const [profileVideo, setProfileVideo] = useState(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [userIP, setUserIP] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const navigate = useNavigate();

  const availableCities = selectedState ? INDIA_STATES_CITIES[selectedState] || [] : [];

  const [videoObjectUrl, setVideoObjectUrl] = useState('');

  useEffect(() => {
    if (profileVideo) {
      const url = URL.createObjectURL(profileVideo);
      setVideoObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setVideoObjectUrl('');
    }
  }, [profileVideo]);

  useEffect(() => {
    return () => {
      if (capturedPhotoUrl) {
        URL.revokeObjectURL(capturedPhotoUrl);
      }
    };
  }, [capturedPhotoUrl]);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (data.ip) setUserIP(data.ip);
      } catch (err) {
        console.error("Auto IP fetch failed", err);
      }
    };
    fetchIP();
  }, []);

  useEffect(() => {
    if (pincode.length === 6) {
      handlePincodeLookup(pincode);
    }
  }, [pincode]);

  const handlePincodeLookup = async (code) => {
    setIsFetchingPincode(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${code}`);
      const data = await response.json();

      if (data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        const state = postOffice.State;
        const district = postOffice.District;

        const normalizedState = STATES.find(s => s.toLowerCase() === state.toLowerCase()) || state;

        setSelectedState(normalizedState);
        setSelectedCity(district);
      }
    } catch (err) {
      console.error("PIN code lookup failed", err);
    } finally {
      setIsFetchingPincode(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    setLocationDetected(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const [locRes, ipRes] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`),
            fetch('https://api.ipify.org?format=json')
          ]);

          const locData = await locRes.json();
          const ipData = await ipRes.json();

          if (ipData.ip) setUserIP(ipData.ip);

          if (locData.address) {
            const { state, city, town, village, postcode } = locData.address;
            const detectedCity = city || town || village;

            if (postcode) setPincode(postcode.replace(/\s/g, '').slice(0, 6));
            if (state) {
              const normalizedState = STATES.find(s => s.toLowerCase() === state.toLowerCase()) || state;
              setSelectedState(normalizedState);
            }
            if (detectedCity) setSelectedCity(detectedCity);

            setLocationDetected(true);
          }
        } catch (err) {
          console.error("Location or IP detection failed", err);
          setLocationDetected(true);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setError("Location access denied or unavailable");
        setIsDetectingLocation(false);
      }
    );
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const compressImage = async (file) => {
    if (!file) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file instanceof Blob ? file : file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height = (maxDim / width) * height;
            width = maxDim;
          } else if (height > maxDim) {
            width = (maxDim / height) * width;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const captureProfilePicFromVideo = (videoEl) => {
    if (!videoEl) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      });
    } catch (err) {
      console.error('Failed to capture profile photo frame:', err);
      return null;
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setProfileVideo(null);
    setCapturedPhotoBlob(null);
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
    setCapturedPhotoUrl('');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
    } catch (err) {
      setError('Could not access camera or microphone: ' + err.message);
      setShowCamera(false);
    }
  };

  const startRecording = () => {
    recordedChunksRef.current = [];
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setProfileVideo(blob);
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      };

      // Automatically capture profile photo frame 1s into recording
      setTimeout(async () => {
        if (videoRef.current) {
          const photoBlob = await captureProfilePicFromVideo(videoRef.current);
          if (photoBlob) {
            setCapturedPhotoBlob(photoBlob);
            setCapturedPhotoUrl(URL.createObjectURL(photoBlob));
          }
        }
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!capturedPhotoBlob && videoRef.current) {
        const photoBlob = await captureProfilePicFromVideo(videoRef.current);
        if (photoBlob) {
          setCapturedPhotoBlob(photoBlob);
          setCapturedPhotoUrl(URL.createObjectURL(photoBlob));
        }
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (file, path, ext = 'jpg', mime = 'image/jpeg') => {
    if (!file) return '';
    // Use an admission specific path based on timestamp and email prefix
    const admissionId = `admission_${Date.now()}_${emailValue.split('@')[0]}`;
    const fileName = `${admissionId}/${path}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('aadhaar_cards')
      .upload(fileName, file, {
        contentType: mime,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('aadhaar_cards')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendEmailNotification = async (candidateData) => {
    try {
      const emailMessage = `
----------------------------------------
ADMISSION VERIFICATION REPORT
----------------------------------------

APPLICATION & CANDIDATE DETAILS:
--------------------------------
• Application Reference ID: ${candidateData.referenceId || 'N/A'}
• Application Status: Pending Admin Approval
• Full Name: ${fullName}
• Email ID: ${candidateData.email}
• PIN Code: ${candidateData.pincode}
• Location: ${candidateData.location}
• Residential Address: ${candidateData.address || 'N/A'}
• IP Address: ${candidateData.ip || 'Not Available'}

VERIFICATION STATUS:
-------------------
• Declaration: CHECKED & ACCEPTED ✓
• Signature: CAPTURED & VERIFIED ✓
• Documentation: ALL ASSETS UPLOADED ✓

LEGAL ACKNOWLEDGEMENT & ATTESTATION:
----------------------------------
1. IDENTITY VERIFICATION:
Candidate authorizes live photo capture for identity
authentication and anti-proxy measures.

2. EMPLOYMENT DISCLAIMER:
Candidate acknowledges certification does not guarantee
employment, placement, or financial increases.

3. ACADEMIC INTEGRITY:
Candidate agrees to complete exams independently
without unauthorized materials or AI assistance.

4. LIMITATION OF LIABILITY:
Portal is not liable for technical failures or candidate-side
connectivity issues during examinations.

FINAL DECLARATION & FULL AGREEMENT:
----------------------------------
SERVICE DELIVERY:
🔎 Step 1: Immediate Admission Confirmation After Payment
The student onboarding journey begins instantly upon checkout. As
soon as a transaction clears our secure platform gateways, our
backend servers trigger an Automated Admission Confirmation Notice.
Students receive an digital welcome package containing their
permanent user profile IDs, platform workspace access routes, and an
overview map of their target educational tracks.

📌 Step 2: Mandatory Document KYC Verification
In strict compliance with structural risk management policies, all
enrolled learners must verify their commercial profile data. Students
are required to securely upload their valid identity documentation
(such as government-issued photo IDs or institutional cards) to our
encrypted verification portal. This step ensures that final completion
documentation matches legal corporate profiles accurately.

🔎 Step 3: Secure Video KYC Authentication
To prevent platform identity theft, proxy testing, and transaction
chargeback vectors, students must execute an automated Video KYC
Verification step. Using an integrated web interface, learners record a
brief, self-directed biometric identity check matching their uploaded
documents. This establishes an unalterable audit trail for security
purposes.

📊 Step 4: System Generation & Delivery of GST Invoice
Accountability and fiscal transparency are foundational to our services.
Within 24 hours of successful verification, our accounting systems
compile a comprehensive, legally compliant Corporate GST Invoice
detailing the exact service breakdown and tax identifiers. This asset is
dispatched straight to the student’s billing tab for corporate tax
deduction filing purposes.

📑 Step 5: Dissemination of Comprehensive PDF Study Material (Strict
One-Time Release)
Upon successful verification, the complete independent text registry
library is unlocked. Students receive high-fidelity, comprehensive PDF
Study Materials and Text Workbooks tailored strictly to their
curriculum.
⚠️ Operational Security Notice: In accordance with our digital asset
protection protocols, all reading materials are shared on a strict one-time basis only. Students must securely download and save these
assets immediately upon distribution, as link refreshes or secondary
file dispatches will not be granted.

🌟 Step 6: Issuance of Formal Training Enrollment Certificate
Before course modules begin, our records registry generates a formal,
verifiable iSuccessNode Enrollment Certificate. This initial credential
serves as an active commercial proof of status, reflecting that the
individual is currently under training within an active, non-affiliated skill
development boot camp.

📈 Step 7: Access Provisioning for Video Lecture Sessions (Strict One-Time Release)
Learners gain access to their master collection of high-definition, pre-recorded visual walkthroughs and technical screen-shares. These
professional Video Lectures contain the entirety of the execution-level
core methodologies.
⚠️ Operational Security Notice: In line with platform distribution rules,
access keys to the video lecture sets are shared on a strict one-time
basis only. Re-sharing, profile splitting, or secondary video deliveries
are completely restricted to safeguard content parameters.

📅 Step 8: Distribution of Final Examination Login Credentials
Once the 10-day, 20-day, or 30-day curriculum timeline has elapsed,
the student workspace triggers the final evaluation phase. The
platform outputs unique, encrypted Final Exam Login Credentials
directly to the student portal, giving them an isolated access window
to complete their timed, multiple-choice evaluation independently.

✅ Step 9: Final Exam Result Processing & Delivery with Provisional
Certificate (PC)
Upon completing the examination, our grading engines parse the
submission data against metric matrices. The comprehensive Final
Exam Result Sheet is computed and displayed instantly inside the
dashboard. Graduates are immediately issued their verified Provisional
Certificate (PC), closing out the service lifecycle and enabling
immediate skill deployment in the corporate sector.

TERMS & CONDITIONS:
📜 TERMS AND CONDITIONS UPDATE: SERVICE FULFILLMENT & NO-REFUND POLICY
1. Scope of Independent Vocational Services
By completing a commercial transaction and registering for any
training program on iSuccessNode (https://isuccessnode.com), the user
(hereinafter referred to as the "Student" or "Client") explicitly
acknowledges and agrees that all services rendered are independent,
skill-based vocational training programs.
iSuccessNode functions strictly as an asynchronous educational
infrastructure platform. Our programs are non-degree, non-diploma
courses and explicitly do not require or maintain any affiliation,
accreditation, or licensing from any university, government institute, or
private educational board. iSuccessNode grants institutional
"Certificates of Completion" and "Provisional Certificates" based
solely on independent competency assessments.

2. Asynchronous Delivery Model & Anti-Interactive Clauses
The Client explicitly understands and accepts that iSuccessNode
operates on a static digital distribution model:
Exclusivity of Medium: Training is delivered solely and exclusively via
pre-recorded, asynchronous video lecture modules and downloadable
PDF text study workbooks.
Prohibition of Live Training: iSuccessNode never offers, promises, or
provides any person-to-person instruction, live classroom training,
group webinars, real-time mentorship, or interactive tutor sessions.
Self-Directed Operational Responsibility: The Student bears absolute
responsibility for navigating the course materials independently within
the platform’s self-contained hosting framework. No claims for refunds
based on the lack of live human interaction will be entertained under
any circumstances, as the platform explicitly disclaims interactive
training.

3. Strict 9-Step Service Delivery Protocol & Binding Benchmarks
Fulfillment of the purchase contract is systematically tracked and
verified by our backend architecture across nine sequential milestones.
By enrolling, the Student agrees to comply with the operational
conditions of each step:
Admission Confirmation After Payment: Triggered instantly upon
payment gateway clearance. This marks the commencement of the
digital contractual relationship.
Mandatory Document KYC: The Student must securely upload valid
government-issued photo identification to verify their profile. Failure to
provide legitimate documentation within the course timeframe will
result in account suspension without a refund.
Mandatory Video KYC Authentication: A biometric video check must
be recorded by the student to verify identity, eliminate fraud, and
prevent proxy test-taking. Accounts failing the security profile checks
are immediately locked to preserve system integrity.
GST Invoice Delivery: A legally compliant Corporate GST Invoice is
compiled and posted to the student's dashboard within 24 hours of
successful validation.
PDF Study Material Dissemination (Strict One-Time Release Clauses):
Comprehensive text materials are unlocked inside the student portal.
The Client acknowledges that files are shared on a strict one-time
basis only. The Student bears the full legal and technical responsibility
to securely save, download, and backup these digital assets
immediately upon distribution. iSuccessNode completely denies any
liability for file loss, hardware failure, or requests for link refreshes
post-distribution.
Enrollment Certificate Issuance: A digital record reflecting that the
individual is actively under training within our independent boot camp
is instantly generated and delivered.
Video Lecture Access Provisioning (Strict One-Time Release Clauses):
Pre-recorded training paths are made accessible to the profile
workspace.
Like the text files, access keys to the video streams are delivered on a
strict one-time basis only. Account sharing, profile splitting, or data
scraping are prohibited and will trigger automated account bans
without a refund.
Final Examination Login Credentials: Upon expiration of the designated
course duration (10, 20, or 30 days maximum), encrypted examination
keys are assigned to the portal.
Final Exam Grading & Provisional Certificate (PC) Delivery: Upon
submission, grading engines compute results instantly, and a
provisional credential is issued to close the service loop.

4. Defatigability of Services & Definitive "No-Refund" Policy
iSuccessNode distributes high-value, proprietary digital intellectual
property. Due to the digital nature of these assets—which can be
instantly viewed, saved, or downloaded upon release—all transactions
executed on https://isuccessnode.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.

[POLICY PROVISION TABLE]
--------------------------------------------------------------------------------------------------------
| POLICY PROVISION | DESCRIPTION & EXECUTION THRESHOLD | LEGAL IMPACT ON CLIENT |
| :--- | :--- | :--- |
| Instant Fulfillment Waiver | Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). | The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed. |
| One-Time Sharing Indemnification | Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. | The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules. |
| KYC Refusal Forfeiture | Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). | The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs. |
| Dispute & Chargeback Mitigation | Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. | Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim. |
--------------------------------------------------------------------------------------------------------

• Instant Fulfillment Waiver: Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed.
• One-Time Sharing Indemnification: Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules.
• KYC Refusal Forfeiture: Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs.
• Dispute & Chargeback Mitigation: Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim.

5. Acceptance of Terms
By scrolling past this screen, clicking "I Agree," or processing a training fee payment on our network domains, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy. If you do not accept these asynchronous, un-affiliated delivery constraints, you must exit our platform immediately and refrain from purchasing any services.

PRIVACY POLICY:
1. Introduction & Scope
This Privacy Policy governs the data collection, storage, processing, and security practices of iSuccessNode (operating through its asynchronous educational infrastructure platform at https://isuccessnode.com).
To deliver independent vocational training programs, identity verification services, and verifiable institutional credentials, iSuccessNode must handle specific personal and biometric data. By registering an account, making a purchase, or completing the security verification steps, you explicitly consent to the collection, processing, and retention practices outlined in this policy.

2. Information We Collect
iSuccessNode processes information through various stages of your onboarding, verification, and educational journey:
A. Personal Identification Data
Registration & Contact Information: Full legal name, billing address, and corporate email address collected during checkout or sign-up.
Fiscal Identity: Information required to generate corporate accounts, including corporate entity names and specific tax identifiers.
B. Mandatory KYC & Security Verification Data
Documentary Identity (Document KYC): Images or digital files of valid government-issued photo identification cards or institutional credential badges uploaded securely to our portal.
Biometric Identity (Video KYC): Self-directed, brief video records processed through an integrated web interface to execute facial matching against submitted documentation and to eliminate proxy testing.
C. Academic & Technical Workspace Logs
Evaluation Records: Answers, responses, submission timestamps, and performance metrics parsed by our grading matrices during automated final examinations.
System & Backend Server Logs: Unique workspace access keys, internet protocol (IP) address mapping, browser data, and precise file-download timestamps related to the release of text libraries and video lecture elements.

3. How We Use Your Data
Your information is processed strictly to maintain platform safety and complete the structural service loop:
Identity Verification & Anti-Fraud: Cross-referencing your biometric Video KYC data with your submitted physical document profile to establish an unalterable audit trail, eliminating proxy test-taking and financial transaction theft.
Service Fulfillment: Provisioning individual profiles with unique access keys to streaming lecture workspaces, digital text repositories, and encrypted final examination modules.
Credential Issuance: Generating accurate legal profiles for formal, verifiable documents, including initial Enrollment Certificates and final Provisional Certificates (PC).
Compliance & Legal Accountability: Compiling and posting legally compliant Corporate GST Invoices straight to your workspace within 24 hours of successful validation.

4. Data Protection, Sharing, and Disclosure
A. Strict Third-Party Restrictions
iSuccessNode treats proprietary and personal data with high security. We do not sell, rent, trade, or share your personal, documentary, or biometric data with external third-party marketing networks or unrelated data brokers.
B. Conditional Sharing Framework
Data is shared exclusively under the following strict conditions:
Payment Processing: Financial details are managed securely via encrypted, external payment gateways during checkout to clear transactions safely.
Dispute and Chargeback Defense: In alignment with our Terms and Conditions, if a user files a transaction dispute, credit card chargeback, or payment reversal claim, iSuccessNode will submit backend server logs (such as download metrics and KYC verification markers) to the involved financial institutions to defend against the claim.
Legal Enforcement: Data may be disclosed if required by an official court order, applicable government statutory body, or prevailing regulatory legal framework.

5. Security & Technical Safeguards
We implement a multi-layered security infrastructure to shield your files and identity profiles:
Data Encryption: Document uploads, video files, and financial invoice generation are processed and stored over secure, encrypted network connections.
Workspace Automated Bans: Automated behavioral system parameters track multi-location concurrent logins. Profiles attempting unauthorized concurrent access, scraping attempts via scripts, or distributing video access streams are banned to ensure ecosystem security.

6. Data Retention Policies
Operational Files: Personal profile structures, exam transcripts, and credential verification links are kept for as long as your workspace account remains active or to fulfill tax, corporate accounting, or institutional tracking standards.
KYC Security Profiles: Biometric checks and government identification logs are preserved securely to maintain an unalterable transaction audit trail, serving as definitive evidence of contractual compliance.

7. Acceptance & Acknowledgement
Interacting with the platform, completing registrations, or inputting identity vectors implies explicit and dynamic acknowledgement of this Privacy Policy. If you do not accept these data handling rules, you must immediately halt data submission and exit the platform.

REFUND POLICY:
1. Executive Summary & Legal Framework of Services
By completing a commercial financial transaction, processing a payment gateway fee, or registering for any independent skill-based training program on the iSuccessNode network domains, the user (hereinafter legally referred to as the "Student", "Client", or "User") explicitly acknowledges, understands, and binds themselves to this comprehensive, non-negotiable Service Fulfillment and No-Refund Policy.
iSuccessNode functions strictly and exclusively as an independent, asynchronous educational infrastructure platform. The digital training pathways, core methodologies, and instructional material hosted on the platform are structured solely as non-degree, non-diploma vocational training programs aimed at execution-level corporate skill development.
Independent Status Notice:
The Client explicitly recognizes that iSuccessNode does not maintain, require, or claim any affiliation, accreditation, licensing, or oversight from any university, government institute, statutory educational body, or private educational board. All institutional credentials, including "Certificates of Completion" and "Provisional Certificates (PC)", are granted based entirely on independent competency assessments managed internally by the platform’s grading matrices. Consequently, normal academic withdrawal policies, student tuition protection schemes, or traditional institutional refund metrics are wholly inapplicable to transactions executed with this platform.

2. Asynchronous Delivery Model & Anti-Interactive Clauses
A fundamental pillar of this refund policy is the nature of the service delivery itself. iSuccessNode operates on a static digital distribution model. The commercial valuation of the program is tied directly to the ingestion of proprietary digital intellectual property rather than live human instruction.
Exclusivity of Medium:
All vocational training curricula are delivered solely and exclusively via pre-recorded, asynchronous video lecture modules and downloadable PDF text study workbooks.
Prohibition of Live Training:
The platform never offers, promises, schedules, or provides any form of person-to-person instruction, live virtual classroom training, synchronous group webinars, real-time mentorship, or interactive tutor-led question-and-answer sessions.
Self-Directed Operational Responsibility:
The Student bears absolute, sole, and un-delegable responsibility for independently navigating, reading, viewing, and completing the course materials within the platform’s self-contained hosting framework.
BINDING CLAUSE: No claims, complaints, demands, or legal petitions for refunds based on a purported lack of live human interaction, lack of custom feedback, or dissatisfaction with the self-guided nature of the platform will be entertained under any circumstances. The platform explicitly disclaims interactive training prior to purchase, and registration constitutes a complete waiver of claims regarding structural isolation during the learning process.

3. The Strict 9-Step Service Delivery Protocol
Fulfillment of the digital purchase contract is systematically tracked, timestamped, and verified by the platform's automated backend server log database. Contractual execution is broken down into nine sequential milestones. By enrolling, the Student agrees that the completion of these milestones constitutes definitive operational execution of the service loop:
[Step 1: Payment & Instant Admission] ➡️ [Step 2: Document KYC] ➡️ [Step 3: Biometric Video KYC]
⬇️
[Step 6: Enrollment Certificate] ⬅️ [Step 5: One-Time PDF Release] ⬅️ [Step 4: Corporate GST Invoice]
⬇️
[Step 7: One-Time Video Release] ➡️ [Step 8: Exam Key Distribution] ➡️ [Step 9: Grading & Provisional Cert]

Step 1: Immediate Admission Confirmation After Payment
This step is triggered instantly upon payment gateway clearance. As soon as the transaction clears, our backend architecture outputs an Automated Admission Confirmation Notice containing permanent user profile IDs, platform workspace access routes, and an educational track overview map. This instantaneous action marks the official commencement of the binding digital contractual relationship.

Step 2: Mandatory Document KYC Verification
In strict compliance with commercial risk management, students are required to securely upload valid government-issued photo identification to our encrypted verification portal. This ensures final documentation matches legal corporate profiles. Failure to upload legitimate documentation within the selected course timeframe results in account suspension without refund eligibility.

Step 3: Secure Video KYC Authentication
To prevent identity theft, proxy test-taking, and transaction chargeback vectors, students must execute an automated, self-directed biometric identity check via an integrated web interface. Accounts failing or refusing this profile check are immediately locked to preserve system integrity, causing immediate forfeiture of fees.

Step 4: System Generation & Delivery of GST Invoice
Accountability and fiscal transparency are verified through the automated compilation of a legally compliant Corporate GST Invoice detailing the exact service breakdown and tax identifiers. This asset is dispatched straight to the student’s billing tab within 24 hours of validation for corporate tax deduction purposes.

Step 5: Dissemination of Comprehensive PDF Study Material (Strict One-Time Release)
Upon successful validation, the comprehensive text registry library is unlocked, allowing the student to view high-fidelity PDF Study Materials and Text Workbooks.
The One-Time Release Clause: Files are shared on a strict one-time basis only. The Student bears full legal and technical responsibility to securely save, download, and backup these digital assets immediately upon distribution. iSuccessNode completely denies any liability for file loss, hardware failure, or requests for link refreshes post-distribution.

Step 6: Issuance of Formal Training Enrollment Certificate
The records registry automatically generates a formal, verifiable iSuccessNode Enrollment Certificate. Delivered straight to the portal dashboard, this initial credential serves as active commercial proof of status, reflecting that the individual is currently under training within an active, non-affiliated skill development boot camp.

Step 7: Access Provisioning for Video Lecture Sessions (Strict One-Time Release)
The student profile is provisioned with access keys to the master collection of pre-recorded visual walkthroughs and technical screen-shares containing execution-level core methodologies.
The One-Time Video Stream Clause: Like the text files, access keys to the video streams are delivered on a strict one-time basis only. Account sharing, profile splitting, or data scraping are prohibited and will trigger automated account bans without a refund.

Step 8: Distribution of Final Examination Login Credentials
Upon the expiration of the designated course duration matrix (10, 20, or 30 days maximum), the student workspace automatically triggers the evaluation phase by outputting unique, encrypted Final Exam Login Credentials directly to the student portal. This provides an isolated access window to complete the timed, multiple-choice evaluation independently.

Step 9: Final Exam Result Processing & Delivery with Provisional Certificate (PC)
Upon submission, grading engines parse the submission data against metric matrices instantly. The comprehensive Final Exam Result Sheet is computed and displayed inside the dashboard, and graduates are immediately issued their verified Provisional Certificate (PC), closing out the service lifecycle.

4. Defatigability of Services & Definitive "No-Refund" Core Policy
iSuccessNode distributes high-value, proprietary digital intellectual property. Due to the digital nature of these assets—which can be instantly viewed, saved, cached, screenshotted, or downloaded immediately upon release—all transactions executed on https://isuccessnode.com are strictly FINAL, NON-CANCELLABLE, AND NON-REFUNDABLE.

[POLICY PROVISION TABLE]
--------------------------------------------------------------------------------------------------------
| POLICY PROVISION | DESCRIPTION & EXECUTION THRESHOLD | LEGAL IMPACT ON CLIENT |
| :--- | :--- | :--- |
| Instant Fulfillment Waiver | Triggered immediately upon Step 1 (Payment Clearance) and Step 5 (PDF Study Material Dissemination). | The Client explicitly waives any right to an operational "cooling-off period" or transaction cancellation once assets are deployed. |
| One-Time Sharing Indemnification | Established upon execution of the "Strict One-Time Release" protocols in Step 5 and Step 7. | The platform is completely indemnified against student complaints regarding data loss, user error, device incompatibility, or platform lockouts resulting from a breach of user rules. |
| KYC Refusal Forfeiture | Triggered if a user refuses or fails Step 2 (Document KYC) or Step 3 (Video KYC). | The user's account will be permanently banned for a security breach. All paid registration fees are entirely forfeited to cover administrative processing costs. |
| Dispute & Chargeback Mitigation | Triggered when a client files a dispute, credit card chargeback, or payment reversal claim. | Treated legally as a breach of contract. The platform will submit this policy and server logs to banks to aggressively deny the claim. |
--------------------------------------------------------------------------------------------------------

5. Exhaustive Legal Provisos & Operational Enforcement
A. Technical Incompatibility & Device Disclaimers
The platform distributes standardized PDF formats and encrypted video stream wrappers. It is the sole technical responsibility of the Client to ensure that their personal hardware devices (desktop, laptop, mobile, or tablet), operating systems, and internet service providers meet the baseline operational requirements needed to stream video data and open PDF document repositories. No refunds will be granted based on technical limitations, outdated user browsers, local firewall blocks, network latency, ISP restrictions, or general device incompatibility.

B. Unilateral Account Revocation for Security Violations
iSuccessNode maintains strict automated behavioral tracking parameters across its workspace dashboards. The platform reserves the right to terminate any user profile instantly, without warning, and without the obligation of financial reimbursement or refund, if the backend system logs detect any of the following unauthorized activities:
- Concurrent multi-location IP logins indicating profile sharing or account splitting.
- Attempted injection of automated data-scraping scripts, download managers, or unauthorized stream-ripping software designed to duplicate proprietary video lectures.
- The uploading of corrupted data packages, malware, or fraudulent identity documentation during Step 2 (Document KYC) or Step 3 (Video KYC) protocols.

C. Program Modification and Discontinuance Indemnity
iSuccessNode reserves the right to modify, adjust, update, or re-sequence any portion of its pre-recorded instructional modules, PDF workbooks, grading metrics, or exam platforms at any time to preserve current corporate relevance. The execution of a curriculum update does not entitle the Client to a retrofitted refund, platform credit, or course exchange.

6. Acceptance of Terms & Dynamic Acknowledgement
By scrolling past presentation screens, checking an "I Agree" checkbox, interacting with any workspace element, or processing a training fee payment on our network domains, you explicitly declare that you have read, understood, and agreed to be legally bound by this Service Delivery Framework and No-Refund Policy.
If you do not accept these asynchronous, un-affiliated delivery constraints, or if you maintain any reservation regarding the definitive finality of commercial transactions executed on this domain, you must exit our platform immediately and refrain from purchasing any services.

ACCEPTED BY CANDIDATE: YES ✓
----------------------------------------

SUPPORTING EVIDENCE:
---------------------
• IP Address: ${candidateData.ip || 'Not Available'}
• Candidate Profile Photo:
${candidateData.photoUrl || 'Not Available'}

• Live Video Statement:
${candidateData.videoUrl || 'Not Available'}

• Aadhaar Card (Front):
${candidateData.frontUrl || 'Not Available'}

• Aadhaar Card (Back):
${candidateData.backUrl || 'Not Available'}

• PAN Card:
${candidateData.panUrl || 'Not Available'}

• Digital Signature:
${candidateData.signUrl || 'Not Available'}

By proceeding, the candidate electronically signs and agrees to all terms above.
----------------------------------------

Submitted via iSuccessNode Exam Portal
`;

      const formData = new FormData();
      formData.append("access_key", "1c05310c-d9e8-4686-95a2-8bde58311e7d");
      formData.append("name", fullName || "New Candidate");
      formData.append("email", candidateData.email);
      formData.append("subject", `Admission Form Submitted — ${fullName || 'New Candidate'}`);
      formData.append("from_name", "iSuccessNode Exam Portal");
      formData.append("message", emailMessage);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      console.log('Web3Forms response status:', response.status);
      console.log('Web3Forms response data:', data);
      if (!data.success) {
        console.error('Web3Forms submission failed:', data.message);
      }
    } catch (err) {
      console.error('Email Notification Error:', err);
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!fullName || !emailValue || !courseName) {
      setError('Please fill out all fields.');
      return;
    }

    setStep(2); // Move to KYC Form
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!profileVideo) return setError('Please record a video statement to continue.');
    if (!signatureBlob) return setError('Please provide your digital signature.');
    if (!panCard) return setError('Please upload your PAN card.');
    if (!acceptedTerms) return setError('Please accept the exam terms to continue.');

    if (!selectedState) return setError('Please select your state.');
    if (!selectedCity) return setError('Please select your city.');

    setUploading(true);
    setUploadStatus('Processing documents...');

    try {
      const [compFront, compBack, compPan] = await Promise.all([
        compressImage(aadhaarFront),
        compressImage(aadhaarBack),
        compressImage(panCard)
      ]);

      setUploadStatus('Uploading files...');

      const [videoUrl, frontUrl, backUrl, panUrl, signUrl] = await Promise.all([
        handleFileUpload(profileVideo, 'profile-video', 'webm', 'video/webm'),
        handleFileUpload(compFront, 'front'),
        handleFileUpload(compBack, 'back'),
        handleFileUpload(compPan, 'pan-card'),
        handleFileUpload(signatureBlob, 'signature')
      ]);

      let photoUrl = '';
      if (capturedPhotoBlob) {
        photoUrl = await handleFileUpload(capturedPhotoBlob, 'profile-photo', 'jpg', 'image/jpeg');
      } else {
        photoUrl = videoUrl;
      }

      setUploadStatus('Saving admission record...');
      const fullAddress = `${address ? address + ', ' : ''}${selectedCity}, ${selectedState} - ${pincode}`;
      const admissionId = crypto.randomUUID();

      const { error: insertError } = await supabase.from('admissions').insert([{
        id: admissionId,
        full_name: fullName,
        email: emailValue,
        phone: '',
        course_name: courseName,
        pincode,
        state: selectedState,
        city: selectedCity,
        address,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        pan_url: panUrl,
        signature_url: signUrl,
        profile_photo_url: photoUrl || videoUrl,
        ip_address: userIP
      }]);

      if (insertError) throw insertError;

      setUploadStatus('Sending email notification...');

      await sendEmailNotification({
        referenceId: admissionId,
        email: emailValue,
        location: `${selectedCity}, ${selectedState}`,
        pincode,
        ip: userIP,
        address,
        photoUrl: photoUrl || 'Not Available',
        videoUrl: videoUrl || 'Not Available',
        frontUrl,
        backUrl,
        panUrl,
        signUrl
      });

      setStep(3); // Success Screen
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const inputClass = "w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900/20 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all duration-300 text-slate-900 font-bold placeholder:text-slate-300 text-sm";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 ml-1 mb-3";

  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] text-center animate-fade-in border border-slate-100">
          <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-100">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Application Submitted</h2>
          <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
            Your admission application and documents have been successfully securely submitted. Our team will review them and contact you shortly.
          </p>
          <button onClick={() => navigate('/')} className="bg-slate-900 text-white w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 md:p-4 font-sans selection:bg-slate-100">
      <div className="w-full max-w-full mx-auto animate-fade-in">

        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-[1.75rem] bg-white text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200 border border-slate-50">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Admission Form</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Step {step} of 2: {step === 1 ? 'Initial Details' : 'Identity Verification'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-6 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-4 animate-slide-up">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleInitialSubmit} className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] overflow-hidden max-w-2xl mx-auto">
            <div className="p-8 md:p-14 space-y-8">
              <div className="space-y-3">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className={labelClass}>Course Name *</label>
                <input
                  type="text"
                  placeholder="Enter the course you're applying for"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  Proceed to Verification
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] overflow-hidden w-full">

            <div className="p-4 md:p-8 space-y-12 w-full">

              {/* Section 1: Verification Data */}
              <div className="space-y-10">
                <div className="flex items-center justify-between border-l-4 border-blue-600 pl-4">
                  <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.25em]">Personal Credentials</h2>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-sm disabled:opacity-50 ${locationDetected
                        ? 'bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-200'
                        : 'bg-emerald-50 border border-emerald-200/50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-0.5'
                      }`}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className={isDetectingLocation ? 'animate-spin' : ''}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {isDetectingLocation ? 'Detecting...' : locationDetected ? 'Location Verified' : 'Detect Location'}
                  </button>
                </div>

                <div className="p-4 md:p-6 bg-slate-50/50 border border-slate-100 border-dashed rounded-[2.5rem] flex flex-col items-center gap-6 group transition-all duration-500 hover:bg-white hover:shadow-xl hover:shadow-slate-100 w-full">
                  <div className="text-center space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Livestream Verification</p>
                  </div>

                  {!showCamera && !profileVideo && (
                    <button type="button" onClick={startCamera} className="w-20 h-20 rounded-full bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 hover:scale-110 active:scale-95 transition-all group/btn">
                      <div className="text-blue-600">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                      </div>
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Open Lens</span>
                    </button>
                  )}

                  {showCamera && (
                    <div className="relative w-full flex flex-col items-center gap-6">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm rounded-[2rem] bg-slate-900 shadow-2xl" />



                      {!isRecording ? (
                        <button type="button" onClick={startRecording} className="bg-rose-600 text-white font-black text-[9px] uppercase tracking-[0.3em] py-3.5 px-10 rounded-2xl shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                          Start Recording
                        </button>
                      ) : (
                        <button type="button" onClick={stopRecording} className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em] py-3.5 px-10 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                          Stop Recording
                        </button>
                      )}
                    </div>
                  )}

                  {profileVideo && !showCamera && (
                    <div className="relative w-full max-w-sm flex flex-col items-center gap-4">
                      <div className="relative w-full">
                        <video src={videoObjectUrl} controls className="w-full rounded-[2rem] shadow-2xl border-4 border-white" />
                        <button type="button" onClick={startCamera} className="absolute -bottom-4 right-4 w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-lg z-10" title="Retake Video">
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        </button>
                      </div>

                      {capturedPhotoUrl && (
                        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-200/80 shadow-sm w-full animate-fade-in">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md bg-slate-100 shrink-0">
                            <img src={capturedPhotoUrl} alt="Captured Profile" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-left">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-950">Profile Photo Captured ✓</span>
                            <span className="block text-[9px] font-semibold text-slate-400">Captured automatically during verification</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/80 p-4 md:p-6 rounded-2xl text-[14px] text-blue-900 font-bold text-left leading-relaxed border border-blue-100 shadow-sm mt-4">
                    <div>
                      <strong className="block mb-2 text-blue-950 uppercase tracking-wider text-[10px]">Please read aloud (English):</strong>
                      "My name is {fullName || '[Full Name]'}, and my registered email address is {emailValue || '[Email Address]'}. I purposely recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in Elite Toolistic's professional training program (available at elitetoolistic.com).
                      <br /><br />
                      I am purchasing this course for personal skill enhancement, professional development, and career growth. I fully accept and understand that Elite Toolistic is only an educational skills-based course training provider and never offers a job promise, job placement assurance, or particular career assurances upon course completion.
                      <br /><br />
                      Furthermore, I certify that I will not file any chargebacks or complaints regarding this transaction in the future. I also promise not to share or distribute any copyrighted course materials supplied to me throughout this program. &quot;This statement is made freely, knowingly, and without pressure.&quot;"
                    </div>

                    <div>
                      <strong className="block mb-2 text-blue-950 uppercase tracking-wider text-[10px]">कृपया ज़ोर से पढ़ें (Hindi):</strong>
                      "मेरा नाम {fullName || '[पूरा नाम]'} है और मेरा रजिस्टर्ड ईमेल एड्रेस {emailValue || '[ईमेल एड्रेस]'} है। मैंने यह वीडियो स्टेटमेंट जान-बूझकर रिकॉर्ड किया है ताकि मैं अपनी प्रोफ़ाइल वेरिफ़ाई कर सकूँ, अपनी पहचान कन्फ़र्म कर सकूँ और Elite Toolistic के प्रोफ़ेशनल ट्रेनिंग प्रोग्राम (जो elitetoolistic.com पर उपलब्ध है) में अपने एनरोलमेंट की पुष्टि कर सकूँ।
                      <br /><br />
                      मैं यह कोर्स अपनी पर्सनल स्किल बढ़ाने, प्रोफ़ेशनल डेवलपमेंट और करियर में आगे बढ़ने के लिए खरीद रहा हूँ। मैं पूरी तरह से मानता और समझता हूँ कि Elite Toolistic सिर्फ़ एक एजुकेशनल स्किल-बेस्ड कोर्स ट्रेनिंग प्रोवाइडर है और कोर्स पूरा होने पर कभी भी नौकरी का वादा, नौकरी मिलने की गारंटी या किसी खास करियर की गारंटी नहीं देता है।
                      <br /><br />
                      इसके अलावा, मैं यह सर्टिफ़ाई करता हूँ कि भविष्य में इस ट्रांज़ैक्शन के बारे में कोई चार्जबैक या शिकायत नहीं करूँगा। मैं यह भी वादा करता हूँ कि इस प्रोग्राम के दौरान मुझे दिए गए किसी भी कॉपीराइट वाले कोर्स मटीरियल को शेयर या डिस्ट्रीब्यूट नहीं करूँगा। &quot;यह स्टेटमेंट बिना किसी दबाव के, पूरी जानकारी के साथ और अपनी मर्ज़ी से दिया जा रहा है।&quot;"
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className={labelClass}>PIN Code *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="6-digit PIN"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={inputClass}
                        required
                      />
                      {isFetchingPincode && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={labelClass}>State / UT *</label>
                    <select value={selectedState} onChange={handleStateChange} className={`${inputClass} appearance-none cursor-pointer`} required>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className={labelClass}>City / District *</label>
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`} required disabled={!selectedState}>
                      <option value="">{selectedState ? 'Select City' : 'Pending Selection...'}</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                      {selectedCity && !availableCities.includes(selectedCity) && (
                        <option value={selectedCity}>{selectedCity}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={labelClass}>Residential Address</label>
                  <input
                    type="text"
                    placeholder="Street, Locality, House No."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Verification Documents */}
              <div className="space-y-10">
                <div className="flex items-center gap-4 border-l-4 border-indigo-600 pl-4">
                  <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.25em]">Verification Documents</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Aadhaar Front *', state: aadhaarFront, setter: setAadhaarFront },
                    { label: 'Aadhaar Back *', state: aadhaarBack, setter: setAadhaarBack },
                    { label: 'PAN Card *', state: panCard, setter: setPanCard }
                  ].map(({ label, state, setter }) => (
                    <div key={label} className="space-y-4">
                      <label className={labelClass.replace('text-slate-900', 'text-slate-400')}>{label}</label>
                      <div className="relative h-40 group/file">
                        <input type="file" accept="image/*" onChange={e => setter(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20" />
                        <div className={`h-full rounded-3xl border border-dashed flex flex-col items-center justify-center transition-all duration-500 px-6 text-center ${state ? 'border-indigo-500 bg-indigo-50/20 text-indigo-600' : 'border-slate-200 bg-white group-hover/file:border-indigo-300 shadow-sm'}`}>
                          {state ? (
                            <>
                              <FilePreview file={state} />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/file:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 rounded-3xl z-10">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Change File</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-slate-50 text-slate-300">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest truncate w-full">Upload File</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Identity Attestation */}
              <div className="space-y-10">
                <div className="flex items-center gap-4 border-l-4 border-emerald-600 pl-4">
                  <h2 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.25em]">Identity Attestation</h2>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 border-dashed overflow-hidden group hover:border-emerald-300 transition-colors shadow-sm">
                  <SignaturePad onSave={(blob) => setSignatureBlob(blob)} onClear={() => setSignatureBlob(null)} placeholder="Sign here (Mouse/Touch/Pen)" />
                </div>
              </div>

              {/* Section 4: Legal Acknowledgement */}
              <div className="space-y-10">
                <div className="flex items-center gap-4 border-l-4 border-orange-600 pl-4">
                  <h2 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.25em]">Legal Acknowledgement</h2>
                </div>

                <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                  <div className="space-y-8 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar text-[13px] text-slate-500 font-medium leading-relaxed">
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">1. Identity Verification and Authentication</h4>
                      <p>To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to record a live video statement at the commencement of and/or during the examination. This video will be used solely to authenticate the Candidate’s identity against registered records and acknowledge their enrollment in the program. Failure to provide a clear video statement or any attempt to bypass this authentication may result in immediate disqualification.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">2. Purpose of Certification and Employment Disclaimer</h4>
                      <p>The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.</p>
                      <ul className="space-y-3 pl-2">
                        <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" /> <span className="font-bold text-slate-900">No Guarantee of Employment:</span> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.</li>
                        <li className="flex gap-3 items-start"><span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" /> <span className="font-bold text-slate-900">No Guarantee of Financial Increase:</span> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.</li>
                      </ul>
                      <p>The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">3. Academic Integrity</h4>
                      <p>The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate’s profile and the nullification of any previous results.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">4. Limitation of Liability</h4>
                      <p>The Portal shall not be held responsible for technical failures on the Candidate’s end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">FINAL DECLARATION & FULL AGREEMENT</h4>
                      <h5 className="font-bold text-slate-800 text-[11px] mt-2">SERVICE DELIVERY:</h5>
                      <ul className="space-y-2 pl-4 list-disc marker:text-slate-400">
                        <li><strong>Enrollment Process:</strong> Customers visit the iSuccessNode website and fill out the Enrollment Form. After form submission, Our team connects with the customer.</li>
                        <li><strong>Process Flow:</strong> A detailed email is shared explaining the complete process flow and fee structure. Payments may also be accepted directly through an authorized professional expert trainer account, where applicable.</li>
                        <li><strong>Explanation:</strong> During the call, the team explains the course structure, learning journey, and assessment-to-certification flow. Customer then confirms participation.</li>
                        <li><strong>Fee Payment:</strong> Upon completion, a GST-compliant invoice is issued within 6 hours. Study materials are shared within 24h.</li>
                        <li><strong>Pre-Exam:</strong> Conducted within 24–48 hours of fee payment to assess initial understanding. Results shared within 24–48h.</li>
                        <li><strong>Certificate:</strong> A Pre-Board Professional Certificate is issued with "Under Training" mentioned.</li>
                        <li><strong>Reward:</strong> Customers scoring above 80% become eligible for a gift from four available options.</li>
                        <li><strong>Training:</strong> Access to recorded video lectures within 15 days. Duration is 90–120 days.</li>
                        <li><strong>Final Exam:</strong> Conducted between 90-120 days.</li>
                        <li><strong>Final Certificate:</strong> Issued upon successful completion, clearly stating status as "Certified."</li>
                        <li><strong>Support:</strong> Team remains in contact for guidance throughout.</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 text-[11px]">TERMS & CONDITIONS:</h5>
                      <ul className="space-y-2 pl-4 list-disc marker:text-slate-400">
                        <li><strong>Delivery:</strong> Complete course delivered within 90-120 days.</li>
                        <li><strong>Access:</strong> Invoice, materials, and videos within 10 working days.</li>
                        <li><strong>Exams:</strong> Pre-Board (24-48h) and Final (90-120 days) attempts.</li>
                        <li><strong>Certification:</strong> Final PC Softcopy indicates "Successfully Certified." Abbreviation format used (e.g., "RCT" for Resilience Coach Training).</li>
                        <li><strong>Training Format:</strong> No live sessions. Materials shared once via email and are non-transferable.</li>
                        <li><strong>Exam Policy:</strong> Multiple attempts are NOT permitted for any exam.</li>
                        <li><strong>Rewards:</strong> 80%+ scorers eligible for gifts worth 50k-100k. Consent required for promotional use of photograph.</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 text-[11px]">PRIVACY POLICY:</h5>
                      <ul className="space-y-2 pl-4 list-disc marker:text-slate-400">
                        <li><strong>Information We Collect:</strong> Personal, payment, course progress, and technical data (IP, device info).</li>
                        <li><strong>Usage:</strong> To process enrollment, provide access, communicate, and improve services. We do NOT sell data.</li>
                        <li><strong>Data Security:</strong> Stored securely in encrypted databases. Only authorized personnel have access.</li>
                        <li><strong>Retention & Rights:</strong> Data retained as necessary. Candidates can request access, correction, or deletion via support.</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 text-[11px]">REFUND POLICY:</h5>
                      <ul className="space-y-2 pl-4 list-disc marker:text-slate-400">
                        <li><strong>No Refund:</strong> Not applicable after attempting any exam (Pre-Board or Final).</li>
                        <li><strong>90% Refund:</strong> Applicable ONLY before attempting any exam and if requested within 24 hours of payment.</li>
                        <li><strong>Deductions:</strong> A 10% deduction applies to all approved refunds to cover administrative and content access costs.</li>
                        <li><strong>Procedure:</strong> Written request via support@isuccessnode.com including full credentials and receipt.</li>
                        <li><strong>Non-Refundable Cases:</strong> Partial completion, delayed progress, accessed content, or general dissatisfaction.</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 text-[11px]">LEGAL NOTICE:</h5>
                      <ul className="space-y-2 pl-4 list-disc marker:text-slate-400">
                        <li><strong>Independent Org:</strong> I-SUCCESSNODE (OPC) PVT. LTD. is an independent entity not affiliated with other bodies.</li>
                        <li><strong>Employment:</strong> Programs are for skill development only; NO guarantee of job placement or financial gain.</li>
                        <li><strong>Third-Party:</strong> No liability for losses from third-party recommendations or representations.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-10 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        required
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        className="w-8 h-8 rounded-xl border-2 border-slate-200 bg-transparent transition-all cursor-pointer appearance-none checked:bg-slate-900 checked:border-slate-900"
                      />
                      {acceptedTerms && (
                        <svg className="absolute top-1.5 left-1.5 w-5 h-5 text-white pointer-events-none" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 leading-relaxed">
                      I have read, understood, and agree to follow all the legal terms and accept full responsibility for my actions.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Section */}
            <div className="p-8 md:p-14 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                disabled={uploading}
              >
                Go Back
              </button>

              <button
                type="submit"
                disabled={uploading || !acceptedTerms}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {uploadStatus || 'Processing...'}
                  </>
                ) : (
                  <>
                    Submit Application
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Admission;
