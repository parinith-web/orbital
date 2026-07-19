import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Menu01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";

import PendingRequestMenu from "@/components/features/friends/PendingRequestMenu";
import FriendsList from "@/components/features/friends/FriendsList";
import { useFriends } from "@/hooks";
import { TooltipWrapper } from "@/components/ui/tooltip";

export default function FriendsTab() {
  const {
    setLeftMobileMenu,
    leftMobileMenu,
    notificationMenu,
    setNotificationMenu,
  } = useUIStore();
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading: isLoadingFriendsData,
  } = useFriends();

  return (
    <>
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden font-sans">
        <div className="flex justify-between px-3 md:pr-2 pr-7 items-center bg-theme-surface border-b border-theme-border py-1 h-12">
          <div className="ml-3 md:flex hidden items-center gap-2 text-white/90">
            <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
            <h1 className="text-md">Friends</h1>
          </div>
          <div className="md:hidden flex items-center gap-2 text-white/90">
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
            <h1 className="text-md font-semibold">Portal</h1>
          </div>
          <div className="flex items-center gap-0">
            <PendingRequestMenu
              pendingRequests={pendingRequests}
              sentRequests={sentRequests}
            />
            <TooltipWrapper content="Notifications">
              <button
                onClick={() => setNotificationMenu(!notificationMenu)}
                className={`lg:hidden relative select-none p-2 cursor-pointer rounded-xl flex items-center justify-center hover:bg-theme-hover`}
              >
                <HugeiconsIcon icon={Notification01Icon} className="w-4 h-4" />
              </button>
            </TooltipWrapper>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <FriendsList friends={friends} isLoading={isLoadingFriendsData} />
          </div>
        </div>
      </div>
    </>
  );
}
