import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/avatar";


export const ProfileButton = ({
  user,
  awayUsers,
}: {
  user: User | null;
  awayUsers: Set<string>;
}) => {
  const router = useRouter();
  const isAway = user?.user_id ? awayUsers.has(user.user_id.toString()) : false;
  const { setLeftMobileMenu } = useUIStore();

  return (
    <div
      onClick={() => {
        router.push("/orbital/settings");
        setLeftMobileMenu?.(false);
      }}
      className="bg-theme-hover flex justify-between items-center cursor-pointer ease-in-out rounded-xl w-60 px-2 py-2"
    >
      <div className="flex gap-4 items-center">
        <div className="relative">
          <UserAvatar
            avatar={user?.avatar}
            size={40}
            className="rounded-[12px] w-10 h-10 overflow-hidden flex items-center justify-center"
          />

          <StatusIndicator isOnline={!isAway} isAway={isAway} />
        </div>
        <div className="flex flex-col text-sm">
          <span className="truncate max-w-[120px]">
            {user?.username ? `${user?.username}` : "Loading..."}
          </span>
          {user?.user_id && (
            <span className="text-[#aaaaaa] font-extralight ease-in-out cursor-pointer">
              {user?.user_id.slice(0, 12)}…
            </span>
          )}
        </div>
      </div>


      <TooltipWrapper content="Logout" side="right">
        <div
          onClick={(e) => {
            e.stopPropagation();
            import("@/store/uiStore").then((m) =>
              m.useUIStore.getState().setModal("LOGOUT"),
            );
          }}
          className="p-1 hover:bg-theme-border rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon
            icon={Logout01Icon}
            className="w-4 h-4 text-white hover:text-gray-200"
          />
        </div>
      </TooltipWrapper>

    </div>
  );
};
