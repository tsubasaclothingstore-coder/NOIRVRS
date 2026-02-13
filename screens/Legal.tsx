import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Legal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    if (location.state && (location.state as any).section) {
      setActiveTab((location.state as any).section);
    }
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="px-8 pb-20 max-w-md mx-auto animate-in fade-in duration-500">
      
      {/* Header / Nav */}
      <div className="sticky top-20 bg-[#0A0A0A]/95 backdrop-blur-md pt-6 pb-6 mb-8 border-b border-white/5 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="text-[9px] uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all mb-6 block"
        >
          ← Return
        </button>

        <div className="flex w-full border border-white/10">
          <button 
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 text-[9px] uppercase tracking-[0.2em] font-bold transition-all ${activeTab === 'terms' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
          >
            Terms
          </button>
          <div className="w-[1px] bg-white/10"></div>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-[9px] uppercase tracking-[0.2em] font-bold transition-all ${activeTab === 'privacy' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
          >
            Privacy
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-12">
        {activeTab === 'terms' ? (
          <section className="space-y-8">
             <div>
              <h2 className="text-xl font-light tracking-tight mb-2 text-[#76F3FF]">TERMS OF UPLINK</h2>
              <p className="text-[10px] mono opacity-40 uppercase">Effective Date: 2025.10.01</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">1. The Protocol</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                By accessing NOIRVRS ("The Service"), you agree to these terms. The Service is a generative narrative engine powered by artificial intelligence. The City is volatile; outputs are non-deterministic and may vary.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">2. Threads & Credits</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                "Threads" are virtual tokens used to initiate story generation. Threads are consumable and non-refundable once the generation process (The Uplink) begins. Subscription allocations reset monthly and do not rollover.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">3. User Conduct</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                You agree not to attempt to reverse-engineer the prompt injection protocols or use the Service to generate illegal, hateful, or explicitly prohibited content. The System logs all injection attempts.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">4. Intellectual Property</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                The stories generated are unique to your session. You are granted a non-exclusive, worldwide license to share, display, and personal archive the content generated under your account. NOIRVRS retains rights to the underlying generative architecture.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">5. Disclaimer</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                The Service is provided "as is". We do not guarantee that the narrative logic will always be flawless or that visual synthesis will be free of artifacts. It is the nature of the machine.
              </p>
            </div>
          </section>
        ) : (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-light tracking-tight mb-2 text-[#76F3FF]">DATA PRIVACY</h2>
              <p className="text-[10px] mono opacity-40 uppercase">Protocol: Secure</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">1. Data Collection</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                We collect only what is necessary to maintain your identity in the city:
                <br/>- Authentication Data (Email/UID)
                <br/>- Usage Statistics (Cases solved, Threads spent)
                <br/>- Generated Content History
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">2. AI Processing</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                To generate stories, your session parameters are transmitted to third-party LLM providers (Google Gemini). These inputs are stateless and are not used to train the base models.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">3. Local Storage</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                NOIRVRS utilizes local storage on your device to cache active case files and profile data for performance. Clearing your browser data may result in the loss of local case history not yet synced to the cloud.
              </p>
            </div>

             <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">4. Account Deletion</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                You may request a total data wipe (identity erasure) by contacting signal@noirvrs.com. All logs, stories, and credits will be permanently deleted.
              </p>
            </div>
          </section>
        )}

        <div className="pt-12 mt-12 border-t border-white/5 text-center">
           <p className="text-[8px] uppercase tracking-[0.5em] opacity-20">NOIRVRS_LEGAL_COMPLIANCE</p>
        </div>
      </div>
    </div>
  );
};

export default Legal;