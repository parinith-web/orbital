"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Menu01Icon,
  BubbleChatIcon,
  UserAdd01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { api } from "@/convex/_generated/api";
import { ChatsView } from "@/components/features/friends/ChatsView";
import { RequestsView } from "@/components/features/friends/RequestsView";
import { FindPeopleView } from "@/components/features/friends/FindPeopleView";
import { FriendsListView } from "@/components/features/friends/FriendsListView";

/**
 * Session 6a built Requests + Find people. Session 6b adds the last
 * sub-view, Chats: `listMyConversations()` wired to `DirectChatThread`
 * (a `ChatUI type="direct"` wrapper, same component RoomChatUI already
 * wraps for room chat — just fed a direct conversation id instead of a
 * room id).
 *
 * Tabs are now controlled (`activeTab` state) instead of relying on
 * `Tabs`' own uncontrolled default, so ChatsView's empty-state "Find
 * people" button can switch tabs programmatically. The default tab also
 * flips to "requests" (once, on first load) when there's an incoming
 * request waiting — otherwise it's easy to land on an empty Chats view
 * and never notice the badge means something needs a response.
 *
 * The pending-request count badge (on both the "Requests" tab and the
 * "Friends" nav item in LeftSidebar) is sourced from the same
 * `listPendingRequests` query RequestsView already needs, so it's one
 * extra `useQuery` call here rather than new backend surface. The
 * "Friends" tab's count follows the same pattern via `listFriends`.
 */
export default function FriendsPage() {
  const { setLeftMobileMenu, leftMobileMenu } = useUIStore();
  const pending = useQuery(api.friends.listPendingRequests);
  const friends = useQuery(api.friends.listFriends);
  const incomingCount = pending?.incoming.length ?? 0;
  const friendsCount = friends?.length ?? 0;

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [pendingOpenUserId, setPendingOpenUserId] = useState<string | null>(null);

  // Resolve the effective tab: explicit selection wins, otherwise default
  // to "requests" when something's waiting, else "chats". Runs once the
  // pending query resolves so we don't flash "chats" then jump to
  // "requests" a moment later.
  if (activeTab === null && !hasAutoSelected && pending !== undefined) {
    setHasAutoSelected(true);
    setActiveTab(incomingCount > 0 ? "requests" : "chats");
  }
  const effectiveTab = activeTab ?? "chats";

  const openChatWith = (userId: string) => {
    setPendingOpenUserId(userId);
    setActiveTab("chats");
  };

  const SUB_TABS = [
    { key: "chats", label: "Chats", icon: BubbleChatIcon, count: 0 },
    { key: "friends", label: "Friends", icon: UserGroupIcon, count: friendsCount },
    { key: "requests", label: "Requests", icon: UserAdd01Icon, count: incomingCount },
    { key: "find-people", label: "Find people", icon: Search01Icon, count: 0 },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 w-full md:px-2 px-3 pt-3 border-b border-theme-border bg-theme-surface">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLeftMobileMenu(!leftMobileMenu);
          }}
          className="flex-none p-1 mb-2 md:hidden rounded-[8px] transition-colors"
        >
          <HugeiconsIcon
            icon={Menu01Icon}
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${leftMobileMenu ? "rotate-180" : ""}`}
          />
        </button>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-xl transition-colors border-b-2 ${
              effectiveTab === tab.key
                ? "border-theme-accent text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <HugeiconsIcon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`flex-none min-w-[18px] h-[18px] px-1 rounded-full text-[10px] leading-[18px] text-center ${
                  tab.key === "requests"
                    ? "bg-red-500 text-white"
                    : "bg-theme-border text-white/70"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {effectiveTab === "chats" && (
          <ChatsView
            onFindPeople={() => setActiveTab("find-people")}
            initialOpenUserId={pendingOpenUserId}
            onConsumeInitialOpen={() => setPendingOpenUserId(null)}
          />
        )}

        {effectiveTab === "friends" && (
          <FriendsListView
            onFindPeople={() => setActiveTab("find-people")}
            onMessage={openChatWith}
          />
        )}

        {effectiveTab === "requests" && <RequestsView />}

        {effectiveTab === "find-people" && <FindPeopleView />}
      </div>
    </div>
  );
}
