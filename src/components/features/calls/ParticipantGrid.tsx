"use client";

import { useCallStore } from "@/store/callStore";
import { useCalls } from "@/hooks";
import { ParticipantCard } from "./ParticipantCard";
import { useUserStore } from "@/store/useUserStore";
import { useRoomCallContext } from "@/contexts/CallContext";

export const ParticipantGrid = () => {
  const {
    callId,
    actualRoomId,
    remoteStreams,
    activeSpeakers,
    localStream,
    screenShareStream,
    screenShareStreams,
  } = useCallStore();
  
  const { activeCalls, participantProfiles } = useRoomCallContext() || useCalls(actualRoomId || "");
  const activeCall = activeCalls.find((call) => call._id === callId);
  const currentUserId = useUserStore((s) => s.user?.user_id);

  const participants =
    activeCall?.participants || (currentUserId ? [currentUserId] : []);

  // Current user always first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a === currentUserId) return -1;
    if (b === currentUserId) return 1;
    return 0;
  });

  // Create MediaState lookup map for O(1) access
  const mediaStateByUserId = new Map(
    (activeCall?.mediaStates || []).map((m) => [m.userId, m]),
  );

  // Collect all screen shares: local + remote
  const screenShares: { userId: string; stream: MediaStream }[] = [];

  // Local screen share
  if (screenShareStream && currentUserId) {
    screenShares.push({ userId: currentUserId, stream: screenShareStream });
  }

  // Remote screen shares (from peers)
  if (screenShareStreams) {
    for (const [userId, stream] of Object.entries(screenShareStreams)) {
      screenShares.push({ userId, stream });
    }
  }

  // Also check mediaStates for remote screen shares that might be via Convex but not yet streamed
  const mediaStatesScreenSharers = new Set<string>();
  activeCall?.mediaStates?.forEach((m) => {
    if (m.isScreenSharing) {
      mediaStatesScreenSharers.add(m.userId);
    }
  });

  const hasScreenShares =
    screenShares.length > 0 || mediaStatesScreenSharers.size > 0;

  // If there are screen shares, use a spotlight layout:
  // - Screen share takes up the large area
  // - Participants are shown in a sidebar strip
  if (hasScreenShares) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row gap-3 p-2 md:p-4 pt-16 pb-20 md:pb-0">
        {/* Main area: Screen share cards (large) */}
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {screenShares.map(({ userId, stream }) => {
            const mediaState = mediaStateByUserId.get(userId);
            const profile = participantProfiles?.[userId];
            return (
              <div key={`screen-${userId}`} className="flex-1 min-h-0">
                <ParticipantCard
                  userId={userId}
                  profile={profile}
                  isSpeaking={activeSpeakers?.includes(userId) || false}
                  videoStream={stream}
                  isLocal={userId === currentUserId}
                  isVideoOn={true}
                  isMuted={mediaState?.isMuted ?? false}
                  isScreenShare={true}
                />
              </div>
            );
          })}
          {/* Show placeholder for users who are screen sharing per mediaState but we don't have their stream yet */}
          {Array.from(mediaStatesScreenSharers)
            .filter((uid) => !screenShares.some((s) => s.userId === uid))
            .map((userId) => {
              const mediaState = mediaStateByUserId.get(userId);
              const profile = participantProfiles?.[userId];
              return (
                <div key={`screen-${userId}`} className="flex-1 min-h-0">
                  <ParticipantCard
                    userId={userId}
                    profile={profile}
                    isSpeaking={false}
                    videoStream={null}
                    isLocal={userId === currentUserId}
                    isVideoOn={true}
                    isMuted={mediaState?.isMuted ?? false}
                    isScreenShare={true}
                  />
                </div>
              );
            })}
        </div>

        {/* Sidebar: Participant cards (small strip) */}
        <div className="md:w-56 flex md:flex-col gap-3 overflow-auto shrink-0">
          {sortedParticipants.map((userId) => {
            const isLocal = userId === currentUserId;
            const stream = isLocal ? localStream : remoteStreams?.[userId];
            const mediaState = mediaStateByUserId.get(userId);
            const profile = participantProfiles?.[userId];

            return (
              <div
                key={userId}
                className="md:h-40 h-28 w-36 md:w-full shrink-0"
              >
                <ParticipantCard
                  userId={userId}
                  profile={profile}
                  isSpeaking={activeSpeakers?.includes(userId) || false}
                  videoStream={stream || null}
                  isLocal={isLocal}
                  isVideoOn={mediaState?.isVideoOn ?? false}
                  isMuted={mediaState?.isMuted ?? false}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard grid layout (no screen shares)
  const count = sortedParticipants.length;
  let gridClass = "grid-cols-1";
  if (count === 2) gridClass = "grid-cols-1 md:grid-cols-2";
  else if (count >= 3 && count <= 4) gridClass = "grid-cols-2";
  else if (count >= 5 && count <= 6) gridClass = "grid-cols-2 md:grid-cols-3";
  else if (count >= 7) gridClass = "grid-cols-3 md:grid-cols-4";

  return (
    <div
      className={`w-full h-full p-4 md:p-4 pt-16 pb-20 grid gap-4 ${gridClass} auto-rows-fr`}
    >
      {sortedParticipants.map((userId) => {
        const isLocal = userId === currentUserId;
        const stream = isLocal ? localStream : remoteStreams?.[userId];
        const mediaState = mediaStateByUserId.get(userId);
        const profile = participantProfiles?.[userId];

        return (
          <ParticipantCard
            key={userId}
            userId={userId}
            profile={profile}
            isSpeaking={activeSpeakers?.includes(userId) || false}
            videoStream={stream || null}
            isLocal={isLocal}
            isVideoOn={mediaState?.isVideoOn ?? false}
            isMuted={mediaState?.isMuted ?? false}
          />
        );
      })}
    </div>
  );
};

