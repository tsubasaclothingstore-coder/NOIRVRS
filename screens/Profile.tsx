
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handlePaymentPlaceholder = (action: string) => {
    console.log(`Placeholder action: ${action}`);
  };

  if (!profile) return null;

  const storiesRead = profile.total_cases || 0;

  return (
    <div className="px-8 max-w-md mx-auto space-y-12 animate-in fade-in duration-500">
      <section className="flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#76F3FF] mb-2">Protocol Identification</p>
          <h2 className="text-3xl font-light tracking-tight truncate max-w-[200px]">
            {profile.citizenId || 'Citizen'}
          </h2>
          <p className="text-[10px] mono opacity-20 mt-1 uppercase tracking-widest">Active Status: Authorized</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-[9px] uppercase tracking-widest opacity-30 hover:opacity-100 hover:text-red-500 transition-all border border-white/10 px-4 py-2 rounded-sm"
        >
          Logout
        </button>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-8 border border-white/10 bg-white/5 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest opacity-40 mb-3">Cases Solved</p>
          <p className="mono text-4xl font-bold">{storiesRead}</p>
        </div>
        <div className="p-8 border border-white/10 bg-white/5 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest opacity-40 mb-3">Threads Left</p>
          <p className="mono text-4xl font-bold text-[#76F3FF]">{profile.threads_remaining ?? 0}</p>
        </div>
      </div>

      <section className="p-8 border border-white/10 bg-white/5 rounded-sm space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-widest opacity-40">Tier Status</span>
          <span className="text-xs uppercase tracking-widest font-bold text-[#76F3FF]">
            {profile.plan?.toUpperCase() || profile.subscriptionTier?.toUpperCase() || 'FREE'}
          </span>
        </div>
        <div className="h-[1px] bg-white/10" />
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-widest opacity-40">Cycle Reset</span>
          <span className="text-xs uppercase tracking-widest font-bold opacity-70">
            {profile.cycle_end ? new Date(profile.cycle_end).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs uppercase tracking-[0.2em] opacity-40 border-b border-white/5 pb-3">Subscription Actions</h3>
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/subscribe')}
            className="w-full py-5 bg-white/5 border border-white/10 text-white text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-white/10 transition-all"
          >
            Manage Subscription
          </button>
          <button 
            onClick={() => handlePaymentPlaceholder('Update Payment')}
            className="w-full py-5 bg-white/5 border border-white/10 text-white/40 text-[9px] uppercase tracking-[0.4em] font-bold hover:text-white transition-all"
          >
            Update Payment Method
          </button>
        </div>
      </section>

      <div className="pt-8 text-center">
        <p className="text-[8px] uppercase tracking-[0.5em] opacity-20">NOIRVRS Core Terminal // Ver {profile.installationDate.toString().slice(-4)}</p>
      </div>
    </div>
  );
};

export default Profile;
