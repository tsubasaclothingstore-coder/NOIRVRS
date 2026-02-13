import React, { createContext, useContext } from 'react';
import { AuthSession } from '../services/authService';
import { UserProfile } from '../types';

export interface AuthContextType {
  user: AuthSession | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true, 
  error: null,
  retry: () => {},
  signOut: async () => {},
  refreshAuth: () => {}
});

export const useAuth = () => useContext(AuthContext);
