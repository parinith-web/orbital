"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GameController01Icon,
  Add01Icon,
  HashtagIcon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";
import { useUserStore } from "@/store/useUserStore";
import { useCurrentUser } from "@/hooks";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants/routes";

/**
 * H6.2 — Game Hub, the real `/orbital` home (replacing H4's placeholder
 * card). Structured as one game tile ("Anomaly") with three entry points —
 * Create Room / Join Room / Play Online — rather than a page-level layout
 * that only happens to fit one game, since the plan calls for more tiles
 * later.
 *
 * Create Room / Join Room open the game-room modals
 * (`setModal("CREATE_GAME_ROOM" | "JOIN_GAME_ROOM")`) — this page owns no
 * room-code/session logic itself, that all already lives in
 * `CreateGameRoomModal`/`JoinGameRoomModal` and the mutations they call.
 * Play Online reuses the existing `/orbital/anomaly` route
 * (`PublicLobbyEntry`) untouched, exactly as H5's "no changes needed" note
 * said.
 *
 * Session 2 — these two buttons used to open `CREATE_ROOM`/`JOIN_ROOM`,
 * which now open the plain chat/call room modals instead (see the Rooms
 * tab). This page keeps starting Anomaly game rooms exactly as before, just
 * via the renamed `CREATE_GAME_ROOM`/`JOIN_GAME_ROOM` keys.
 */
export default function Page() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const { user: profile } = useCurrentUser();
  const setModal = useUIStore((s) => s.setModal);

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl p-8 flex flex-col items-center text-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-theme-hover flex items-center justify-center">
            <HugeiconsIcon icon={GameController01Icon} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">Anomaly</h1>
            <p className="text-sm text-gray-400 mt-1">
              A word-based imposter game. Create a room for your friends, join
              one with a code, or jump into a public match.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <Button
            variant="primary"
            className="w-full justify-center gap-2"
            onClick={() => setModal("CREATE_GAME_ROOM")}
          >
            <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
            Create Room
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-center gap-2"
            onClick={() => setModal("JOIN_GAME_ROOM")}
          >
            <HugeiconsIcon icon={HashtagIcon} className="w-4 h-4" />
            Join Room
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-center gap-2"
            onClick={() => router.push(ROUTES.ORBITAL_ANOMALY)}
          >
            <HugeiconsIcon icon={PlayCircleIcon} className="w-4 h-4" />
            Play Online
          </Button>
        </div>
      </div>
    </div>
  );
}
