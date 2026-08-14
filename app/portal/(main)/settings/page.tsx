"use client";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, Menu01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { UserInfoTab } from "@/components/features/profile/ProfilePage/UserInfoTab";
import { PreferencesTab } from "@/components/features/profile/ProfilePage/PreferencesTab";

// Settings route — merges the former standalone Profile (`/portal/profile`)
// and Preferences (`/portal/preferences`) destinations into a single tab.
// UserInfoTab and PreferencesTab are both fully self-contained (they read/
// write the user store and colorContext/PreferencesContext respectively),
// so this page just supplies the shared header chrome plus a small
// sub-tab switcher between the two, and mounts whichever is active.
type SettingsSubTab = "profile" | "preferences";

const SUB_TABS: { key: SettingsSubTab; label: string; icon: typeof UserIcon }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "preferences", label: "Preferences", icon: Settings01Icon },
];

export default function SettingsPage() {
  const { setLeftMobileMenu, leftMobileMenu } = useUIStore();
  const [activeTab, setActiveTab] = useState<SettingsSubTab>("profile");

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
          <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
          <h1 className="text-md">Settings</h1>
        </div>
      </div>

      <div className="flex items-center gap-1 w-full md:px-2 px-3 pt-3 border-b border-theme-border bg-theme-surface">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-xl transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-theme-accent text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <HugeiconsIcon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "profile" ? <UserInfoTab /> : <PreferencesTab />}
      </div>
    </div>
  );
}
