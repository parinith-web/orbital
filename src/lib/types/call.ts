import type { Id } from "@/convex/_generated/dataModel";

export type CallId = Id<"calls">;

export type CallSessionStatus = "idle" | "joining" | "joined" | "leaving" | "error";

export interface CallRoomMetadata {
  id: string;
  name: string;
}

export interface CallSessionTarget {
  callId: CallId;
  room: CallRoomMetadata;
  userId: string;
  startedAt?: number;
}

export interface CallSessionSnapshot {
  status: CallSessionStatus;
  callId: CallId | null;
  actualRoomId: string | null;
  roomName: string | null;
  isMuted: boolean;
  participantCount: number;
  error: string | null;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  screenShareStream: MediaStream | null;
  joinedAt: number | null;
  startedAt: number | null;
  activeSpeakers: string[];
  remoteStreams: Record<string, MediaStream>;
  screenShareStreams: Record<string, MediaStream>;
  availableDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string | null;
  selectedVideoDeviceId: string | null;
}

/** Shared call record shape matching the Convex schema. */
export interface CallRecord {
  _id: Id<"calls">;
  participants: string[];
  allParticipants: string[];
  activePeerIds?: { userId: string; peerId: string }[];
  mediaStates?: { userId: string; isMuted: boolean; isVideoOn: boolean; isScreenSharing?: boolean }[];
  startedAt: number;
  endedAt?: number;
  roomId: string;
  isActive: boolean;
}

/** Callback to update media state in Convex. */
export type UpdateMediaStateFn = (args: {
  callId: CallId;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
}) => Promise<unknown>;
