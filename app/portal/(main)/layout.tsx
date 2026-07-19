"use client";
import LeftSidebar from "@/components/layout/LeftSidebar";
import NotificationTab from "@/components/features/notifications/NotificationTab";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden text-white">
      <LeftSidebar className="w-64" />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      <NotificationTab />
    </div>
  );
}
