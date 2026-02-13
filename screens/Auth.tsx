import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshAuth } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.includes('@')) {
      setError("INVALID_SIGNAL: Enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("WEAK_ENCRYPTION: Password must be 6+ chars.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password);
      } else {
        await authService.signIn(email, password);
      }
      refreshAuth();
    } catch (err: any) {
      setError(err.message || "UPLINK_ERROR: Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      refreshAuth();
    } catch (err: any) {
      setError("GOOGLE_UPLINK_FAILED.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 max-w-md mx-auto flex flex-col justify-center min-h-[80vh] text-center animate-in fade-in duration-700">
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 mb-2">PROTOCOL IDENTIFICATION</p>
        <h2 className="text-3xl font-light tracking-tight mb-4">
          {isSignUp ? 'New Citizen' : 'Citizen Unknown'}
        </h2>
        <p className="text-sm font-light tracking-widest opacity-40 uppercase">
          {isSignUp ? 'Register your signal to continue.' : 'Enter the city.'}
        </p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4 mb-8">
        <div className="space-y-1 text-left">
          <input 
            type="email" 
            placeholder="EMAIL_ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 px-5 py-4 text-sm focus:outline-none focus:border-[#76F3FF] focus:ring-1 focus:ring-[#76F3FF]/30 transition-all placeholder:opacity-20"
          />
        </div>
        <div className="space-y-1 text-left">
          <input 
            type="password" 
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 px-5 py-4 text-sm focus:outline-none focus:border-[#76F3FF] focus:ring-1 focus:ring-[#76F3FF]/30 transition-all placeholder:opacity-20"
          />
        </div>

        {error && (
          <div className="text-[10px] uppercase tracking-widest text-red-500 py-2">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-white text-black text-[10px] uppercase tracking-[0.4em] font-black hover:bg-[#76F3FF] transition-all disabled:opacity-50"
        >
          {loading ? 'CALIBRATING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
        </button>

        <button 
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-[10px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity underline underline-offset-8"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an identity? Create account'}
        </button>
      </form>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-[8px] uppercase tracking-[0.5em]">
          <span className="bg-[#0A0A0A] px-4 opacity-20">External Sync</span>
        </div>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-5 border border-white/10 text-white/40 text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        CONTINUE WITH GOOGLE
      </button>
      
      <p className="mt-16 text-[9px] uppercase tracking-[0.5em] opacity-10 font-mono">
        NV_UPLINK_STABLE // NOIRVRS_1.0.0
      </p>
    </div>
  );
};

export default Auth;
