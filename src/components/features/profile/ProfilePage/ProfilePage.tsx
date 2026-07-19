"use client";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  UserCircleIcon,
  Settings01Icon,
  Cancel01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { UserInfoTab } from "./UserInfoTab";
import { PreferencesTab } from "./PreferencesTab";
import { useUIStore } from "@/store/uiStore";

export default function ProfilePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("Info");

  const { setLeftMobileMenu, leftMobileMenu } = useUIStore();

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between w-full md:px-2 px-3 items-center bg-theme-surface border-b border-theme-border py-1 h-12">
        <div className="md:ml-3 flex items-center w-full justify-between text-white/90">
          <div className="flex gap-2 items-center">
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
            <HugeiconsIcon icon={UserIcon} className="w-4 h-4" />
            <h1 className="text-md">Profile</h1>
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-theme-hover rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 md:flex-row flex-col">
        {/* Sidebar */}
        <div className="md:flex hidden w-[22%] h-full bg-theme-surface border-r border-theme-border p-3 flex-col gap-2">
          <button
            onClick={() => setCurrentTab("Info")}
            className={`flex text-sm items-center ${currentTab == "Info" ? "bg-theme-hover" : "bg-theme-surface"} hover:bg-theme-hover gap-1 px-3 py-2 rounded-[8px]`}
          >
            <HugeiconsIcon icon={UserCircleIcon} className="w-4 h-4" />
            <span>User Info</span>
          </button>
          <button
            onClick={() => setCurrentTab("Preferences")}
            className={`flex text-sm items-center ${currentTab == "Preferences" ? "bg-theme-hover" : "bg-theme-surface"} hover:bg-theme-hover gap-1 px-3 py-2 rounded-[8px]`}
          >
            <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="flex items-center md:hidden p-2 gap-1">
          <button
            onClick={() => setCurrentTab("Info")}
            className={`flex text-sm items-center ${currentTab == "Info" ? "bg-theme-hover" : "bg-theme-base"} gap-1 px-3 py-1 rounded-[8px]`}
          >
            <HugeiconsIcon icon={UserCircleIcon} className="w-4 h-4" />
            <span>User Info</span>
          </button>
          <button
            onClick={() => setCurrentTab("Preferences")}
            className={`flex text-sm items-center ${currentTab == "Preferences" ? "bg-theme-hover" : "bg-theme-base"} gap-1 px-3 py-1 rounded-[8px]`}
          >
            <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
            <span>Preferences</span>
          </button>
        </div>
        <div className="w-full overflow-y-auto h-full pb-10">
          {currentTab === "Info" && <UserInfoTab />}
          {currentTab === "Preferences" && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}
