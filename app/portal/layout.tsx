"use client";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useConvexAuth } from "convex/react";
import { RoomsProvider } from "@/contexts/roomContext";
import { useUserStore } from "@/store/useUserStore";
import { usePathname } from "next/navigation";
import { ColorProvider, useColor } from "@/contexts/colorContext";
import NotificationListener from "@/components/features/notifications/NotificationListener";
import CallCleanupListener from "@/components/features/calls/CallCleanupListener";
import PortalShellSkeleton from "@/components/skeletons/PortalShellSkeleton";
import { useCurrentUser } from "@/hooks";
import { OnboardingDialog } from "@/components/features/auth/OnboardingDialog";

function PortalLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const pathname = usePathname();
  const { isThemeReady } = useColor();
  const isRoomPage = pathname.startsWith("/portal/room");
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: profile, isLoading: isProfileLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/?redirect=${pathname}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  useEffect(() => {
    const wasDeleted = sessionStorage.getItem("accountDeleted") === "true";
    if (wasDeleted) {
      sessionStorage.removeItem("accountDeleted");
      if (!isLoading && isAuthenticated) {
        router.replace("/?deleted=true");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
    router.replace("/portal");
  };

  if ((isLoading || !isThemeReady || isProfileLoading) && !isRoomPage) {
    return <PortalShellSkeleton />;
  }

  const wasDeleted =
    typeof window !== "undefined" &&
    sessionStorage.getItem("accountDeleted") === "true";

  // Show onboarding if authenticated but no profile exists in Convex
  // Skip if account was intentionally deleted (redirect to landing instead)
  if (
    isAuthenticated &&
    !isProfileLoading &&
    !profile &&
    !wasDeleted &&
    !hasOnboarded
  ) {
    return <OnboardingDialog onComplete={handleOnboardingComplete} />;
  }

  // If deleted, redirect away before profile loads
  if (isAuthenticated && !isProfileLoading && !profile && wasDeleted) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("accountDeleted");
      router.replace("/?deleted=true");
    }
    return null;
  }

  if (!user?.user_id) {
    return null;
  }

  return (
    <RoomsProvider user_id={user.user_id}>
      <section className="flex h-[100dvh] w-full overflow-hidden font-sans bg-theme-surface">
        <Suspense fallback={null}></Suspense>
        <NotificationListener />
        <CallCleanupListener />
        <div className="flex-1">{children}</div>
      </section>
    </RoomsProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutContent>{children}</PortalLayoutContent>;
}
