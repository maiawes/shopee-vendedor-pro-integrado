import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { firebaseAuth } from "@/integrations/firebase/client";

export interface AppUser {
  id: string;
  email: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}

interface AuthContextType {
  user: AppUser | null;
  session: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      const next = firebaseUser ? {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        email_confirmed_at: firebaseUser.emailVerified ? (firebaseUser.metadata.creationTime ?? null) : null,
        user_metadata: { full_name: firebaseUser.displayName ?? "" },
      } : null;
      setSession(next);
      setUser(next);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
