"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { AvatarMaker } from "@/components/avatar";
import {
  type AvatarConfig,
  decodeAvatarConfig,
  isAvatarConfigCode,
} from "@/lib/avatar/options";
import { useCurrentUser, useUserProfileActions } from "@/hooks";
import { useUserStore } from "@/store/useUserStore";

// Doubles as two things: an unauthenticated marketing/preview page (linked
// from the landing site, no `redirect` param — Save just persists locally
// via AvatarMaker's own demo localStorage logic) and the real "edit my
// avatar" screen for signed-in users, reached with `?redirect=/some/path`
// from Settings. When a Convex profile is present, Save writes the
// avatar-maker config to it for real and sends the user back to
// `redirect` (defaulting to /orbital/settings).
export default function AvatarMakerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const { user } = useCurrentUser();
  const { changeAvatar } = useUserProfileActions();
  const setStoreUser = useUserStore((s) => s.setUser);

  const initialConfig: AvatarConfig | undefined = useMemo(() => {
    if (user?.avatar && isAvatarConfigCode(user.avatar)) {
      return decodeAvatarConfig(user.avatar);
    }
    return undefined;
  }, [user?.avatar]);

  const handleSave = user
    ? async (_config: AvatarConfig, code: string) => {
        try {
          const res = await changeAvatar(code);
          if (res?.error) {
            toast.error(res.error);
            return;
          }
          setStoreUser({ ...user, avatar: code });
          toast.success("Avatar updated");
          router.push(redirectTo || "/orbital/settings");
        } catch {
          toast.error("Failed to save avatar");
        }
      }
    : undefined;

  const backHref = redirectTo || "/";
  const backLabel = redirectTo ? "← Back to settings" : "← Back home";

  return (
    <div className="min-h-screen bg-[#0a080b] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 65% 10%, rgba(46,111,242,0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 15% 80%, rgba(255,61,138,0.18), transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-16">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors mb-8"
        >
          {backLabel}
        </Link>

        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/50">
            Avatar maker
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-6xl text-center mb-4 tracking-tight">
          Build Your Avatar
        </h1>
        <p className="text-center text-[#888] text-base sm:text-lg max-w-xl mx-auto mb-12 md:mb-16">
          Mix a color, a pair of eyes, a mouth, and a hat. Thousands of
          combinations, all yours to swap any time.
        </p>

        <AvatarMaker onSave={handleSave} initialConfig={initialConfig} />
      </div>
    </div>
  );
}
