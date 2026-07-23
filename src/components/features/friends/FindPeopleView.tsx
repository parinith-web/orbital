"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, UserAdd01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { Button, Input } from "@/components/ui";
import { UserProfilePopup } from "@/components/popups/UserProfilePopup";
import { useUserStore } from "@/store/useUserStore";

type RequestStatus = "none" | "sending" | "pending" | "friends";

/**
 * Session 6a — Find People sub-view. `searchUsers` (Session 5) only
 * returns id/username/avatar, so friend/pending status per result is
 * derived client-side from `listFriends` + `listPendingRequests` (both
 * already fetched for the other Friends sub-views) rather than adding a
 * new backend query.
 */
export function FindPeopleView() {
  const user = useUserStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const results = useQuery(
    api.friends.searchUsers,
    debouncedQuery ? { search_query: debouncedQuery } : "skip",
  );
  const friends = useQuery(api.friends.listFriends);
  const pending = useQuery(api.friends.listPendingRequests);
  const sendRequest = useMutation(api.friends.sendFriendRequest);

  const [sendingTo, setSendingTo] = useState<string | null>(null);
  // Tracks requests sent this session so the button flips to "Pending"
  // immediately, before listPendingRequests' next reactive update lands.
  const [justSent, setJustSent] = useState<Set<string>>(new Set());

  const friendIds = useMemo(
    () => new Set((friends ?? []).map((f) => f.friend.user_id)),
    [friends],
  );
  const outgoingPendingIds = useMemo(
    () => new Set((pending?.outgoing ?? []).map((r) => r.user.user_id)),
    [pending],
  );

  const statusFor = (targetUserId: string): RequestStatus => {
    if (friendIds.has(targetUserId)) return "friends";
    if (outgoingPendingIds.has(targetUserId) || justSent.has(targetUserId)) {
      return "pending";
    }
    if (sendingTo === targetUserId) return "sending";
    return "none";
  };

  const handleAdd = async (targetUserId: string) => {
    setSendingTo(targetUserId);
    try {
      const result = await sendRequest({ to_user_id: targetUserId });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setJustSent((prev) => new Set(prev).add(targetUserId));
        toast.success(
          result.status === "accepted"
            ? "You're now friends!"
            : "Friend request sent",
        );
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 pb-0">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          rightElement={
            <div className="pr-3 pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-gray-400" />
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!debouncedQuery ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <HugeiconsIcon icon={Search01Icon} className="w-10 h-10 opacity-40" />
            <p className="text-sm">Search for people by username.</p>
          </div>
        ) : results === undefined ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Searching...
          </div>
        ) : results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <p className="text-sm">No users found for &ldquo;{debouncedQuery}&rdquo;.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-w-xl mx-auto">
            {results.map((result) => {
              const status = statusFor(result.user_id);
              return (
                <div
                  key={result.user_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-theme-surface"
                >
                  <UserProfilePopup
                    user={{
                      id: result.user_id,
                      username: result.username,
                      avatarUrl: result.avatar,
                    }}
                    currentUserId={user?.user_id}
                    side="right"
                    align="start"
                  >
                    <button className="flex items-center gap-3 min-w-0 flex-1 text-left">
                      <Image
                        src={getAvatarUrl(result.avatar)}
                        alt={result.username}
                        width={36}
                        height={36}
                        unoptimized
                        className="w-9 h-9 rounded-[10px] flex-none object-cover"
                      />
                      <span className="truncate text-white/90">{result.username}</span>
                    </button>
                  </UserProfilePopup>

                  <div className="flex-none">
                    {status === "friends" ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 px-2">
                        <HugeiconsIcon icon={Tick01Icon} className="w-3.5 h-3.5" />
                        Friends
                      </span>
                    ) : status === "pending" ? (
                      <span className="text-xs text-gray-400 px-2">Pending</span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1.5"
                        disabled={status === "sending"}
                        onClick={() => handleAdd(result.user_id)}
                      >
                        <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindPeopleView;
