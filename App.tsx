
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getLocalProfile } from './services/ritualService';
import { authService, AuthSession } from './services/authService';
import { UserProfile } from './types';
import Layout from './components/Layout';
import Landing from './screens/Landing';
import Reader from './screens/Reader';
import ProfileScreen from './screens/Profile';
import Subscribe from './screens/Subscribe';
import Help from './screens/Help';
import Auth from './screens/Auth';

interface AuthContextType {
  user: AuthSession | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true, 
  error: null,
  retry: () => {},
  signOut: async () => {},
  refreshAuth: () => {}
});

export const useAuth = () => useContext(AuthContext);

/**
 * ProtectedRoute component to guard routes that require authentication.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncProfile = useCallback(() => {
    setLoading(true);
    try {
      const session = authService.getCurrentSession();
      if (session) {
        setUser(session);
        const p = getLocalProfile();
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err: any) {
      setError("Identity synchronization failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncProfile();
  }, [syncProfile]);

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshAuth = () => {
    syncProfile();
  };

  if (loading) return (
    <div className="bg-[#0A0A0A] min-h-screen flex flex-col items-center justify-center">
      <div className="w-1.5 h-1.5 bg-[#76F3FF] rounded-full animate-ping mb-4" />
      <p className="text-[10px] uppercase tracking-[0.3em] opacity-20">Syncing Identity...</p>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, retry: syncProfile, signOut, refreshAuth }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
            <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
            <Route path="/reader" element={<Navigate to="/reader/current" replace />} />
            <Route path="/reader/:caseId" element={<ProtectedRoute><Reader /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
