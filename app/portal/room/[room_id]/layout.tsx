"use client";

import { useParams } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import TopBar from "@/components/layout/TopBar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { DetailsSidebar } from "@/components/features/rooms/sidebar/DetailsSidebar";
import { CallOverlay } from "@/components/features/calls/CallOverlay";
import { RoomCallProvider } from "@/contexts/CallContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const room_id = params.room_id as string;
  const { isSidebarOpen } = useUIStore();

  return (
    <RoomCallProvider roomId={room_id}>
      <section className="flex h-[100dvh] overflow-hidden">
        <div className="flex-1 flex">
          <LeftSidebar
            className="w-64 flex-shrink-0"
          />
          <div className="flex-1 flex flex-col min-w-0 bg-theme-surface">
            <TopBar room_id={room_id} />
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-hidden relative">
                {children}
              </div>
              {isSidebarOpen && (
                <DetailsSidebar id={room_id} type="room" />
              )}
            </div>
            <CallOverlay />
          </div>
          <RightSidebar room_id={room_id} />
        </div>
      </section>
    </RoomCallProvider>
  );
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutContent>{children}</LayoutContent>;
}
