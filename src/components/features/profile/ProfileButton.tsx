import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { TooltipWrapper } from "@/components/ui/tooltip";


export const ProfileButton = ({
  user,
  awayUsers,
}: {
  user: User | null;
  awayUsers: Set<string>;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAway = user?.user_id ? awayUsers.has(user.user_id.toString()) : false;
  const { setLeftMobileMenu } = useUIStore();

  return (
    <div
      onClick={() => {
        router.push("/portal/profile");
        setLeftMobileMenu?.(false);
      }}
      className={`${/^\/portal\/profile$/.test(pathname) ? "bg-theme-hover" : ""} flex justify-between items-center cursor-pointer hover:bg-theme-hover ease-in-out rounded-xl w-60 px-2 py-2`}
    >
      <div className="flex gap-4 items-center">
        <div className="relative">
          <Image
            src={user?.avatar || "/defaultAvatar.png"}
            alt="Avatar"
            width={40}
            height={40}
            unoptimized
            className="rounded-[12px] w-10 h-10"
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
