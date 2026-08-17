"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { PublicLobbyEntry } from "@/components/features/anomaly/PublicLobbyEntry";
import { ROUTES } from "@/lib/constants/routes";

/**
 * E1 — Feature 2's entry route. Mirrors the room page's auth-guard shape
 * (redirect to home if signed out) — there's no membership check to make
 * here the way a room page has, since the public lobby has no invite list
 * by design (PRD §3: "no-invite-needed").
 */
export default function Page() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace(ROUTES.HOME);
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) return null;

  return <PublicLobbyEntry />;
}
