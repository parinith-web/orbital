import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useActiveConversationId(): string | null {
  const pathname = usePathname();

  return useMemo(() => {
    const roomMatch = pathname.match(/^\/portal\/room\/([^\/]+)(\/.*)?$/);
    if (roomMatch) {
      return roomMatch[1];
    }

    return null;
  }, [pathname]);
}
