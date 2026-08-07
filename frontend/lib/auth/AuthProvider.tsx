"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Role, UserProfile } from "@tech-survivor/types";
import { firebaseAuth } from "../firebaseClient";
import { apiClient } from "../apiClient";

interface MeResponse {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: Role;
  profile: UserProfile | null;
}

interface AuthState {
  firebaseUser: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const me = await apiClient.get<MeResponse>("/auth/me");
      setProfile(me.profile);
      setRole(me.role);
    } catch {
      setProfile(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadMe();
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadMe]);

  const value = useMemo<AuthState>(
    () => ({ firebaseUser, profile, role, loading, refreshProfile: loadMe }),
    [firebaseUser, profile, role, loading, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
