
const AUTH_KEY = 'noirvrs_session';
const USERS_DB_KEY = 'noirvrs_mock_users_db';

export interface AuthSession {
  uid: string;
  email: string;
  displayName?: string;
}

export const authService = {
  getCurrentSession: (): AuthSession | null => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  getAuthToken: async (): Promise<string> => {
    const session = authService.getCurrentSession();
    if (!session) throw new Error("AUTH_REQUIRED");
    return `mock-token-${session.uid}`; 
  },

  signIn: async (email: string, password: string): Promise<AuthSession> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      throw new Error("ACCESS_DENIED: Invalid credentials.");
    }

    const session = { uid: user.uid, email: user.email };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  },

  signUp: async (email: string, password: string): Promise<AuthSession> => {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error("CONFLICT: Citizen already registered.");
    }

    const newUser = { uid: `uid_${Date.now()}`, email, password };
    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    const session = { uid: newUser.uid, email: newUser.email };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  },

  signInWithGoogle: async (): Promise<AuthSession> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const session = { uid: 'google_user_123', email: 'detective@noirvrs.com', displayName: 'Detective' };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  },

  signOut: async () => {
    localStorage.removeItem(AUTH_KEY);
  }
};
