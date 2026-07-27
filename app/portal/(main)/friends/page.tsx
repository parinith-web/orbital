"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatsView } from "@/components/features/friends/ChatsView";
import { RequestsView } from "@/components/features/friends/RequestsView";
import { FindPeopleView } from "@/components/features/friends/FindPeopleView";

/**
 * Session 6a built Requests + Find people. Session 6b adds the last
 * sub-view, Chats: `listMyConversations()` wired to `DirectChatThread`
 * (a `ChatUI type="direct"` wrapper, same component RoomChatUI already
 * wraps for room chat — just fed a direct conversation id instead of a
 * room id).
 *
 * Tabs are now controlled (`activeTab` state) instead of relying on
 * `Tabs`' own uncontrolled default, so ChatsView's empty-state "Find
 * people" button can switch tabs programmatically.
 *
 * The pending-request count badge (on both the "Requests" tab and the
 * "Friends" nav item in LeftSidebar) is sourced from the same
 * `listPendingRequests` query RequestsView already needs, so it's one
 * extra `useQuery` call here rather than new backend surface.
 */
export default function FriendsPage() {
  const { setLeftMobileMenu, leftMobileMenu } = useUIStore();
  const pending = useQuery(api.friends.listPendingRequests);
  const incomingCount = pending?.incoming.length ?? 0;
  const [activeTab, setActiveTab] = useState("chats");

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
        <div className="p-3 pb-0">
          <TabsList>
            <TabsTrigger value="chats" />
            <TabsTrigger value="requests">
              Requests
              {incomingCount > 0 && (
                <span className="flex-none min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center">
                  {incomingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="find-people">Find people</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex flex-col">
          <ChatsView onFindPeople={() => setActiveTab("find-people")} />
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
