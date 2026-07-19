import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUserStore } from "@/store/useUserStore";
import { getDirectConversationId } from "@/lib/utils/message";

export function useActiveConversationId(): string | null {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);

  return useMemo(() => {
    const friendMatch = pathname.match(/^\/portal\/friend\/([^\/]+)(\/.*)?$/);
    if (friendMatch) {
      const friendId = friendMatch[1];
      if (user?.user_id) {
        return getDirectConversationId(friendId, user.user_id);
      }
      return friendId;
    }

    const roomMatch = pathname.match(/^\/portal\/room\/([^\/]+)(\/.*)?$/);
    if (roomMatch) {
      return roomMatch[1];
    }

    return null;
  }, [pathname, user?.user_id]);
}
