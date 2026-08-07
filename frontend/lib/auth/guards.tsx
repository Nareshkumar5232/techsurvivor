"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@tech-survivor/types";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useAuth } from "./AuthProvider";

/** Redirects to /login if there is no signed-in user. Renders nothing while auth state is
 *  still resolving, so protected pages never flash before redirecting. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/login");
  }, [loading, firebaseUser, router]);

  if (loading || !firebaseUser) return <FullPageSpinner label="Checking your session..." />;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { role: currentRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentRole && currentRole !== role) {
      router.replace(currentRole === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [loading, currentRole, role, router]);

  if (loading || currentRole !== role) return <FullPageSpinner />;
  return <>{children}</>;
}

/** Participants must finish their profile before touching any round. */
export function RequireProfileComplete({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && !profile.profileComplete) {
      router.replace("/complete-profile");
    }
  }, [loading, profile, router]);

  if (loading || !profile?.profileComplete) return <FullPageSpinner />;
  return <>{children}</>;
}
