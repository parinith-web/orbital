"use client";
import LeftSidebar from "@/components/layout/LeftSidebar";

// The right-hand notification panel is gone: removed from the shell in
// Session 1, and its component (NotificationTab.tsx) deleted outright in
// Session 7 once nothing referenced it anymore. Everything now lives in
// the left panel (see LeftSidebar.tsx). Background notification handling
// (toasts, listeners) is unaffected — that lives in app/portal/layout.tsx
// via NotificationListener and is untouched here.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden text-white">
      <LeftSidebar className="w-64" />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
