
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { profile: user } = useAuth();
  const [rechargeInfo, setRechargeInfo] = useState<string>('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user) return;

    const calculateRecharge = () => {
      if (user.isSubscribed && (user.subscriptionTier === 'pro' || user.subscriptionTier === 'premium')) {
        setRechargeInfo('UNLIMITED UPLINK');
        return;
      }

      const now = Date.now();
      const diff = user.cycle_end - now;

      if (diff <= 0) {
        setRechargeInfo('RECHARGE ACTIVE');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setRechargeInfo(`RECHARGE IN ${days}D ${hours}H`);
      } else if (hours > 0) {
        setRechargeInfo(`RECHARGE IN ${hours}H ${minutes}M`);
      } else {
        setRechargeInfo(`RECHARGE IN ${minutes}M`);
      }
    };

    calculateRecharge();
    const interval = setInterval(calculateRecharge, 60000); // Efficient 1m update
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const hasThreads = user.threads_remaining > 0;
  const hasActiveCase = !!user.activeCaseId;

  const handleAction = () => {
    if (hasActiveCase) {
      navigate(`/reader/${user.activeCaseId}`);
    } else {
      navigate('/reader/new');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-8 text-center min-h-[70vh] animate-in fade-in duration-700">
      <div className={`w-16 h-16 border ${hasThreads ? 'border-[#76F3FF]/30' : 'border-red-500/20'} rounded-full flex items-center justify-center mb-12 ${hasThreads ? 'animate-pulse' : ''}`}>
        <div className={`w-2 h-2 ${hasThreads ? 'bg-[#76F3FF]' : 'bg-red-500/50'} rounded-full photon-glow`}></div>
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-light tracking-tighter mb-4 uppercase">The city is speaking.</h2>
        <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
          {hasThreads 
            ? "A new narrative signal has been localized. Open the thread to proceed."
            : "Communications are jammed. Secure more threads to continue the investigation."
          }
        </p>
      </div>

      {hasThreads ? (
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={handleAction}
            className="w-full px-10 py-5 bg-white text-black text-[10px] uppercase tracking-[0.4em] font-black hover:bg-[#76F3FF] transition-all duration-300 shadow-xl"
          >
            {hasActiveCase ? 'Resume Active Case' : 'Start New Investigation'}
          </button>
          
          <div className="pt-8 opacity-40">
            <p className="text-[9px] uppercase tracking-[0.3em] mb-1">Signal Strength</p>
            <p className="mono text-xl font-bold text-[#76F3FF]">{user.threads_remaining} Threads</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={() => navigate('/subscribe')}
            className="w-full py-5 bg-[#76F3FF] text-black text-[10px] uppercase tracking-[0.3em] font-black hover:brightness-110 transition-all shadow-[0_0_20px_rgba(118,243,255,0.3)]"
          >
            Secure New Threads
          </button>
          <div className="opacity-30 pt-8">
            <p className="text-[9px] uppercase tracking-[0.3em] mb-1">Monthly Recharge Cycle</p>
            <p className="mono text-xl font-bold">{rechargeInfo}</p>
          </div>
        </div>
      )}

      <div className="mt-20 pt-8 border-t border-white/5 w-full max-w-xs">
        <p className="text-[8px] uppercase tracking-[0.5em] opacity-20 mb-6 font-mono">NOIRVRS_IDENTITY_SERVICE</p>
      </div>
    </div>
  );
};

export default Landing;
