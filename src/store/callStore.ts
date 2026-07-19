"use client";

import { create } from "zustand";
import { CallClient } from "@/lib/calls/client";
import type {
  CallSessionSnapshot,
  CallSessionTarget,
  UpdateMediaStateFn,
} from "@/lib/types/call";

const callClient = new CallClient();

const initialSnapshot: CallSessionSnapshot = {
  status: "idle",
  callId: null,
  actualRoomId: null,
  roomName: null,
  isMuted: false,
  participantCount: 0,
  error: null,
  isVideoOn: false,
  isScreenSharing: false,
  localStream: null,
  screenShareStream: null,
  joinedAt: null,
  startedAt: null,
  activeSpeakers: [],
  remoteStreams: {},
  screenShareStreams: {},
  availableDevices: [],
  selectedAudioDeviceId: null,
  selectedVideoDeviceId: null,
};

interface CallStoreState extends CallSessionSnapshot {
  joinCall: (target: CallSessionTarget) => Promise<string>;
  leaveCall: () => Promise<void>;
  toggleMute: () => Promise<boolean | void>;
  toggleVideo: () => Promise<boolean | void>;
  toggleScreenShare: () => Promise<boolean | void>;
  syncParticipants: (participants: { userId: string; peerId: string }[]) => void;
  setUpdateMediaState: (fn: UpdateMediaStateFn) => void;
  refreshDevices: () => Promise<void>;
  setAudioSource: (deviceId: string) => Promise<void>;
  setVideoSource: (deviceId: string) => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  ...initialSnapshot,

  async joinCall(target): Promise<string> {
    const current = get();

    // Already in this call
    if (current.callId === target.callId && (current.status === "joined" || current.status === "joining")) {
      return "";
    }

    // In a different call — leave first
    if (current.callId && current.callId !== target.callId) {
      await get().leaveCall();
    }

    set({
      status: "joining",
      callId: target.callId,
      actualRoomId: target.room.id,
      roomName: target.room.name,
      error: null,
      participantCount: 0,
      startedAt: target.startedAt || Date.now(),
    });

    try {
      const peerId = await callClient.connect(target, {
        onStatusChange(snapshot) {
          set(snapshot);
        },
        onJoined() {
          set({
            status: "joined",
            joinedAt: Date.now(),
            error: null,
          });
        },
        onDisconnected() {
          set({ ...initialSnapshot });
        },
        onError(message) {
          set({
            ...initialSnapshot,
            callId: target.callId,
            actualRoomId: target.room.id,
            roomName: target.room.name,
            status: "error",
            error: message,
          });
        },
      });
      return peerId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join call";
      set({
        ...initialSnapshot,
        callId: target.callId,
        actualRoomId: target.room.id,
        roomName: target.room.name,
        status: "error",
        error: message,
      });
      throw error;
    }
  },

  async leaveCall() {
    if (get().status === "idle") return;

    set({ status: "leaving", error: null });

    try {
      await callClient.disconnect();
    } finally {
      set({ ...initialSnapshot });
    }
  },

  async toggleMute() {
    const isMuted = await callClient.toggleMute();
    set({ isMuted, error: null });
  },

  async toggleVideo() {
    const isVideoOn = await callClient.toggleVideo();
    set({ isVideoOn, error: null });
  },

  async toggleScreenShare() {
    const isScreenSharing = await callClient.toggleScreenShare();
    set({ isScreenSharing, error: null });
  },

  syncParticipants(participants) {
    if (get().status === "joined") {
      callClient.syncParticipants(participants);
    }
  },

  setUpdateMediaState(fn: UpdateMediaStateFn) {
    callClient.setUpdateMediaState(fn);
  },
  
  async refreshDevices() {
    await callClient.refreshDevices();
  },

  async setAudioSource(deviceId: string) {
    await callClient.setAudioSource(deviceId);
  },

  async setVideoSource(deviceId: string) {
    await callClient.setVideoSource(deviceId);
  },

  clearError() {
    set({ error: null });
  },

  setError(message: string) {
    set({ error: message });
  },
}));
