"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { PreferencesTab } from "@/components/features/profile/ProfilePage/PreferencesTab";

// Session 2 — standalone Preferences route. PreferencesTab is fully
// self-contained (colorContext + PreferencesContext), so this page just
// supplies the shared header chrome and mounts it directly, replacing the
// Session 1 placeholder.
export default function PreferencesPage() {
  const { setLeftMobileMenu, leftMobileMenu } = useUIStore();

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
          <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
          <h1 className="text-md">Preferences</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PreferencesTab />
      </div>
    </div>
  );
}
