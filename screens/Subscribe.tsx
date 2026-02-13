
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { updateLocalProfile } from '../services/ritualService';
import { useAuth } from '../contexts/AuthContext';
import { PRICING, THREAD_LIMITS } from '../constants';

const Subscribe: React.FC = () => {
  const navigate = useNavigate();
  const { profile, retry } = useAuth();

  const handleSubscribe = (tier: 'pro' | 'premium') => {
    updateLocalProfile({
      isSubscribed: true,
      subscriptionTier: tier,
      plan: tier,
      threads_remaining: THREAD_LIMITS[tier as keyof typeof THREAD_LIMITS]
    });
    retry();
    navigate('/');
  };

  const handleBuyPack = () => {
    if (!profile) return;
    updateLocalProfile({
      threads_remaining: (profile.threads_remaining || 0) + 10
    });
    retry();
    navigate('/');
  };

  if (!profile) return null;

  const currentTier = profile.subscriptionTier || 'free';
  const threadsExhausted = (profile.threads_remaining || 0) === 0;

  return (
    <div className="px-8 max-w-md mx-auto flex flex-col justify-center min-h-[85vh]">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-light tracking-tight mb-2">Stay in the city.</h2>
        <p className="text-white/40 text-sm tracking-tight">More threads. Fewer limits.</p>
      </div>

      <div className="space-y-4">
        <div className={`p-6 border ${currentTier === 'free' ? 'border-[#76F3FF]/30 bg-[#76F3FF]/5' : 'border-white/5 bg-white/5'} transition-all`}>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-medium">Free</h3>
            {currentTier === 'free' && <span className="text-[9px] uppercase tracking-widest text-[#76F3FF]">Active</span>}
          </div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">4 threads / month</p>
          <p className="text-xs italic opacity-30">Just enough to get hooked.</p>
        </div>

        {currentTier !== 'premium' && (
          <button 
            onClick={() => handleSubscribe('pro')}
            className={`w-full p-6 border text-left transition-all group ${currentTier === 'pro' ? 'border-[#76F3FF] bg-[#76F3FF]/10' : 'border-white/10 hover:border-white/30'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-lg font-medium">Pro</h3>
              <span className="mono font-bold">{PRICING.pro} / month</span>
            </div>
            <p className="text-xs uppercase tracking-widest opacity-60 mb-2">40 threads / month</p>
            <p className="text-xs italic opacity-30 mb-4">For regular nights.</p>
            {currentTier !== 'pro' && (
              <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#76F3FF] group-hover:translate-x-1 transition-transform">
                Upgrade to Pro →
              </div>
            )}
          </button>
        )}

        <button 
          onClick={() => handleSubscribe('premium')}
          className={`w-full p-6 border text-left transition-all group relative overflow-hidden ${currentTier === 'premium' ? 'border-[#76F3FF] bg-[#76F3FF]/15' : 'border-white/10 hover:border-[#76F3FF]/50'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-medium">Premium</h3>
            <span className="mono font-bold">{PRICING.premium} / month</span>
          </div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">60 threads / month</p>
          <p className="text-xs italic opacity-30 mb-4">Priority access. Smooth sessions.</p>
          {currentTier !== 'premium' && (
            <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#76F3FF] group-hover:translate-x-1 transition-transform">
              Upgrade to Premium →
            </div>
          )}
        </button>

        {threadsExhausted && (
          <button 
            onClick={handleBuyPack}
            className="w-full p-6 bg-[#76F3FF] text-black text-left transition-all hover:brightness-110 photon-glow mt-8"
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-lg font-black uppercase tracking-tighter">10 Threads</h3>
              <span className="mono font-black">{PRICING.pack}</span>
            </div>
            <p className="text-xs italic opacity-70 mb-4">Just one more run.</p>
            <div className="text-[10px] uppercase tracking-[0.4em] font-black">
              Get 10 Threads
            </div>
          </button>
        )}
      </div>

      <div className="mt-12 flex flex-col items-center gap-6">
        <button 
          onClick={() => window.history.back()} 
          className="text-[10px] uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity underline underline-offset-8"
        >
          Not tonight.
        </button>
        
        <p className="text-[9px] uppercase tracking-[0.6em] opacity-20">NOIRVRS GUEST MODE</p>
      </div>
    </div>
  );
};

export default Subscribe;
