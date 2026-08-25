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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex justify-between w-full md:px-2 px-3 items-center bg-theme-surface border-b border-theme-border py-1 h-12">
        <div className="md:ml-3 flex items-center w-full gap-2 text-white/90">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLeftMobileMenu(!leftMobileMenu);
            }}
            className="flex-none p-1 md:hidden rounded-[8px] transition-colors"
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${leftMobileMenu ? "rotate-180" : ""}`}
            />
          </button>
          <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
          <h1 className="text-md">Friends</h1>
        </div>
      </div>

      <Tabs
        value={effectiveTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="flex-1 min-h-0"
      >
        <TabsList className="p-2 border-r border-theme-border">
          <TabsTrigger value="chats">
            <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4 flex-none" />
            <span>Chats</span>
          </TabsTrigger>
          <TabsTrigger value="friends">
            <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 flex-none" />
            <span>Friends</span>
            {friendsCount > 0 && (
              <span className="ml-auto flex-none min-w-[18px] h-[18px] px-1 rounded-full bg-theme-border text-white/70 text-[10px] leading-[18px] text-center">
                {friendsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4 flex-none" />
            <span>Requests</span>
            {incomingCount > 0 && (
              <span className="ml-auto flex-none min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center">
                {incomingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="find-people">
            <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 flex-none" />
            <span>Find people</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex flex-col">
          <ChatsView
            onFindPeople={() => setActiveTab("find-people")}
            initialOpenUserId={pendingOpenUserId}
            onConsumeInitialOpen={() => setPendingOpenUserId(null)}
          />
        </TabsContent>

        <TabsContent value="friends" className="flex flex-col">
          <FriendsListView
            onFindPeople={() => setActiveTab("find-people")}
            onMessage={openChatWith}
          />
        </TabsContent>

        <TabsContent value="requests" className="flex flex-col">
          <RequestsView />
        </TabsContent>

        <TabsContent value="find-people" className="flex flex-col">
          <FindPeopleView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
