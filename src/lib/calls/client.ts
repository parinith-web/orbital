"use client";

import type {
  CallSessionTarget,
  CallSessionSnapshot,
  UpdateMediaStateFn,
} from "@/lib/types/call";
import { RemoteAudioSinkManager } from "./audioSinkManager";
import { SpeakerDetector } from "./speakerDetector";

import type PeerType from "peerjs";

interface PeerCallbacks {
  onStatusChange(snapshot: Partial<CallSessionSnapshot>): void;
  onJoined(): void;
  onDisconnected(): void;
  onError(message: string): void;
}

export class CallClient {
  private peer: PeerType | null = null;
  private connections = new Map<string, any>();
  private localStream: MediaStream | null = null;
  private readonly audioSinkManager = new RemoteAudioSinkManager();
  private callbacks: PeerCallbacks | null = null;
  private target: CallSessionTarget | null = null;
  private isDisconnecting = false;
  private isPeerOpen = false;
  private hasJoined = false;
  private pendingCalls = new Set<string>();
  private lastPeerMappings: { userId: string; peerId: string }[] | null = null;
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private localVideoStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>();
  private dummyVideoTrack: MediaStreamTrack | null = null;
  private updateMediaState: UpdateMediaStateFn | null = null;

  // Screen sharing
  private screenShareStream: MediaStream | null = null;
  private isScreenSharing = false;
  private screenShareConnections = new Map<string, any>();
  private remoteScreenShareStreams = new Map<string, MediaStream>();

  // Device management
  private availableDevices: MediaDeviceInfo[] = [];
  private selectedAudioDeviceId: string | null = null;
  private selectedVideoDeviceId: string | null = null;

  // Peer-to-user mapping
  private peerToUser: Map<string, string> = new Map();

  private readonly speakerDetector = new SpeakerDetector(() =>
    this.broadcastStatus(),
  );
  private combinedLocalStream: MediaStream | null = null;

  private deviceChangeHandler: (() => void) | null = null;

  private notifyMediaState(
    patch: Omit<Parameters<UpdateMediaStateFn>[0], "callId">,
  ): void {
    if (!this.target?.callId || !this.updateMediaState) return;
    void this.updateMediaState({ callId: this.target.callId, ...patch });
  }

  private closeConnections(map: Map<string, any>): void {
    for (const conn of map.values()) {
      conn?.close?.();
    }
    map.clear();
  }

  private stopStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => track.stop());
  }

  private getMappedUserId(peerId: string): string | undefined {
    return this.peerToUser.get(peerId);
  }

  private stopScreenShare(shouldBroadcast = true): void {
    this.stopStream(this.screenShareStream);
    this.screenShareStream = null;
    this.isScreenSharing = false;
    this.closeConnections(this.screenShareConnections);
    this.notifyMediaState({ isScreenSharing: false });
    if (shouldBroadcast) this.broadcastStatus();
  }

  setUpdateMediaState(fn: UpdateMediaStateFn) {
    this.updateMediaState = fn;
  }

  async connect(
    target: CallSessionTarget,
    callbacks: PeerCallbacks,
  ): Promise<string> {
    if (this.peer) {
      await this.disconnect();
    }

    this.target = target;
    this.callbacks = callbacks;
    this.isDisconnecting = false;
    this.isPeerOpen = false;
    this.hasJoined = false;
    this.pendingCalls.clear();
    this.lastPeerMappings = null;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        this.selectedAudioDeviceId = audioTrack.getSettings().deviceId || null;
      }

      await this.refreshDevices();

      this.deviceChangeHandler = () => {
        this.refreshDevices().catch(() => {});
      };
      navigator.mediaDevices.addEventListener(
        "devicechange",
        this.deviceChangeHandler,
      );

      const { default: Peer } = await import("peerjs");

      const uniquePeerId = `${target.userId}-${Math.random().toString(36).substring(2, 9)}`;

      this.peer = new Peer(uniquePeerId, {
        host: "0.peerjs.com",
        port: 443,
        path: "/",
        secure: true,
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun.services.mozilla.com" },
          ],
        },
      });

      this.setupPeerListeners();
      this.speakerDetector.ensureReady();
      const localAudioTrack = this.localStream.getAudioTracks()[0];
      if (localAudioTrack) {
        this.speakerDetector.attachTrack("local", localAudioTrack);
      }

      return uniquePeerId;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initialize call";
      callbacks.onError(message);
      await this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isDisconnecting = true;
    this.lastPeerMappings = null;

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    this.closeConnections(this.connections);
    this.closeConnections(this.screenShareConnections);

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.stopStream(this.localStream);
    this.localStream = null;

    this.stopStream(this.localVideoStream);
    this.localVideoStream = null;

    this.stopStream(this.screenShareStream);
    this.screenShareStream = null;
    this.isScreenSharing = false;

    this.dummyVideoTrack?.stop();
    this.dummyVideoTrack = null;

    await this.speakerDetector.dispose();

    if (this.deviceChangeHandler) {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        this.deviceChangeHandler,
      );
      this.deviceChangeHandler = null;
    }

    this.remoteStreams.clear();
    this.remoteScreenShareStreams.clear();
    this.peerToUser.clear();

    this.audioSinkManager.clear();

    this.combinedLocalStream = null;

    this.pendingCalls.clear();

    if (this.hasJoined) {
      this.callbacks?.onDisconnected();
    }
    this.hasJoined = false;
    this.isDisconnecting = false;
    this.isPeerOpen = false;
  }

  async toggleMute(): Promise<boolean> {
    if (!this.localStream) return true;
    const track = this.localStream.getAudioTracks()[0];
    if (!track) return true;

    track.enabled = !track.enabled;
    const isMuted = !track.enabled;

    this.notifyMediaState({ isMuted });

    this.updateCombinedLocalStream();
    this.broadcastStatus();
    return isMuted;
  }

  async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;

    if (this.localVideoStream) {
      this.localVideoStream.getVideoTracks().forEach((t) => {
        this.connections.forEach((call) => {
          const pc = call.peerConnection as RTCPeerConnection;
          const sender = pc
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender && this.dummyVideoTrack) {
            void sender.replaceTrack(this.dummyVideoTrack);
          }
        });
        t.stop();
      });
      this.localVideoStream = null;

      this.updateCombinedLocalStream();
      this.notifyMediaState({ isVideoOn: false });

      this.broadcastStatus();
      return false;
    }

    try {
      this.localVideoStream = await navigator.mediaDevices.getUserMedia({
        video: this.selectedVideoDeviceId
          ? { deviceId: { exact: this.selectedVideoDeviceId } }
          : true,
      });

      const videoTrack = this.localVideoStream.getVideoTracks()[0];
      if (videoTrack) {
        this.selectedVideoDeviceId = videoTrack.getSettings().deviceId || null;
        this.connections.forEach((call) => {
          const pc = call.peerConnection as RTCPeerConnection;
          const sender = pc
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            void sender.replaceTrack(videoTrack);
          } else {
            const stream = this.getCombinedLocalStream();
            if (stream && pc) {
              pc.addTrack(videoTrack, stream);
              this.triggerRenegotiation(pc);
            }
          }
        });
      }

      this.notifyMediaState({ isVideoOn: true });

      this.updateCombinedLocalStream();
      this.broadcastStatus();
      return true;
    } catch (err) {
      console.error("[CallClient] Failed to get video stream:", err);
      return false;
    }
  }

  async refreshDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices;
      this.broadcastStatus();
    } catch (err) {
      console.error("[CallClient] Failed to enumerate devices:", err);
    }
  }

  async setAudioSource(deviceId: string): Promise<void> {
    this.selectedAudioDeviceId = deviceId;
    if (!this.localStream) {
      this.broadcastStatus();
      return;
    }

    try {
      const oldTrack = this.localStream.getAudioTracks()[0];
      const isMuted = oldTrack ? !oldTrack.enabled : false;

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getAudioTracks()[0];

      if (newTrack) {
        newTrack.enabled = !isMuted;
        if (oldTrack) {
          oldTrack.stop();
          this.localStream.removeTrack(oldTrack);
        }
        this.localStream.addTrack(newTrack);

        this.connections.forEach((call) => {
          const pc = call.peerConnection as RTCPeerConnection;
          const sender = pc
            ?.getSenders()
            .find((s) => s.track?.kind === "audio");
          if (sender) void sender.replaceTrack(newTrack);
        });

        this.updateCombinedLocalStream();
        this.speakerDetector.ensureReady();
        this.speakerDetector.attachTrack("local", newTrack);
      }
    } catch (err) {
      console.error("[CallClient] Failed to set audio source:", err);
    }
    this.broadcastStatus();
  }

  async setVideoSource(deviceId: string): Promise<void> {
    this.selectedVideoDeviceId = deviceId;

    if (!this.localVideoStream) {
      this.broadcastStatus();
      return;
    }

    try {
      const oldTrack = this.localVideoStream.getVideoTracks()[0];

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getVideoTracks()[0];

      if (newTrack) {
        if (oldTrack) {
          oldTrack.stop();
          this.localVideoStream.removeTrack(oldTrack);
        }
        this.localVideoStream.addTrack(newTrack);

        this.connections.forEach((call) => {
          const pc = call.peerConnection as RTCPeerConnection;
          const sender = pc
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) void sender.replaceTrack(newTrack);
        });

        this.updateCombinedLocalStream();
      }
    } catch (err) {
      console.error("[CallClient] Failed to set video source:", err);
    }
    this.broadcastStatus();
  }

  syncParticipants(peerMappings: { userId: string; peerId: string }[]): void {
    if (!this.peer || !this.target || !this.localStream) return;

    this.lastPeerMappings = peerMappings;
    peerMappings.forEach((m) => this.peerToUser.set(m.peerId, m.userId));

    if (!this.isPeerOpen) return;

    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    this.syncDebounceTimer = setTimeout(() => {
      this.syncDebounceTimer = null;
      this.doSyncParticipants(peerMappings);
    }, 1000);
  }

  async toggleScreenShare(): Promise<boolean> {
    if (this.isScreenSharing && this.screenShareStream) {
      this.stopScreenShare();
      return false;
    }

    try {
      this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });

      this.isScreenSharing = true;

      const videoTrack = this.screenShareStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      this.initiateScreenShareCalls();
      this.notifyMediaState({ isScreenSharing: true });

      this.broadcastStatus();
      return true;
    } catch (err) {
      console.error("[CallClient] Failed to get screen share:", err);
      this.isScreenSharing = false;
      this.screenShareStream = null;
      return false;
    }
  }

  // --- Private ---

  private doSyncParticipants(
    peerMappings: { userId: string; peerId: string }[],
  ): void {
    if (!this.peer || !this.target || !this.localStream) return;

    const currentUserId = this.target.userId;
    if (!currentUserId) return;

    peerMappings.forEach(({ userId, peerId }) => {
      this.peerToUser.set(peerId, userId);
      if (userId === currentUserId) return;
      if (this.connections.has(peerId) || this.pendingCalls.has(peerId)) return;

      this.pendingCalls.add(peerId);
      this.initiateCall(peerId);
    });

    this.broadcastStatus();
  }

  private setupPeerListeners(): void {
    if (!this.peer) return;

    this.peer.on("open", () => {
      this.isPeerOpen = true;
      if (!this.hasJoined) {
        this.hasJoined = true;
        this.callbacks?.onJoined();
      }

      if (this.lastPeerMappings) {
        this.doSyncParticipants(this.lastPeerMappings);
      }
    });

    this.peer.on("disconnected", () => {
      this.isPeerOpen = false;
    });

    this.peer.on("call", (incomingCall) => {
      const metadata = incomingCall.metadata;

      if (metadata?.type === "screen-share") {
        // This is a screen share call — handle separately
        this.handleIncomingScreenShareCall(incomingCall);
        return;
      }

      this.updateCombinedLocalStream();
      const combined = this.combinedLocalStream;
      if (!combined) return;

      incomingCall.answer(combined);
      this.setupCallHandlers(incomingCall);
    });

    this.peer.on("error", (err) => {
      if (err.type === "peer-unavailable") return;
      console.error("[CallClient] Peer error:", err.type, err);
      this.callbacks?.onError(`Call system error: ${err.type}`);
    });
  }

  private initiateCall(remotePeerId: string, retryCount = 0): void {
    if (!this.peer || this.isDisconnecting) return;

    this.updateCombinedLocalStream();
    const combined = this.combinedLocalStream;
    if (!combined) return;

    try {
      const outgoingCall = this.peer.call(remotePeerId, combined);
      if (!outgoingCall) {
        throw new Error("PeerJS failed to create outgoing call object");
      }
      this.setupCallHandlers(outgoingCall);

      outgoingCall.on("close", () => {
        this.handleCallRetry(remotePeerId, retryCount);
      });

      outgoingCall.on("error", (err: any) => {
        console.warn("[CallClient] initiateCall error:", err);
        this.handleCallRetry(remotePeerId, retryCount);
      });
    } catch (err) {
      console.warn("[CallClient] initiateCall error:", err);
      this.handleCallRetry(remotePeerId, retryCount);
    }
  }

  private handleCallRetry(remotePeerId: string, retryCount: number): void {
    if (this.connections.has(remotePeerId)) return;
    if (retryCount >= 3 || !this.peer || this.isDisconnecting) {
      this.pendingCalls.delete(remotePeerId);
      return;
    }

    this.pendingCalls.add(remotePeerId);

    setTimeout(
      () => {
        this.initiateCall(remotePeerId, retryCount + 1);
      },
      2000 + retryCount * 1000,
    );
  }

  private setupCallHandlers(call: any): void {
    const remotePeerId = call.peer;
    this.connections.set(remotePeerId, call);
    this.pendingCalls.delete(remotePeerId);

    if (this.isScreenSharing && this.screenShareStream) {
      this.initiateScreenShareCallToPeer(remotePeerId);
    }

    call.on("stream", (remoteStream: MediaStream) => {
      this.pendingCalls.delete(remotePeerId);
      this.remoteStreams.set(remotePeerId, remoteStream);

      remoteStream.onaddtrack = () => this.broadcastStatus();
      remoteStream.onremovetrack = () => this.broadcastStatus();

      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        try {
          this.speakerDetector.attachTrack(remotePeerId, audioTrack);
        } catch (err) {
          console.error("Failed to setup audio analyser", err);
        }
      }

      this.audioSinkManager.attach({
        id: remotePeerId,
        participantId: remotePeerId,
        type: "audio",
        stream: remoteStream,
        track: remoteStream.getAudioTracks()[0],
        isMuted: () => !remoteStream.getAudioTracks()[0]?.enabled,
        mute: async () => {
          if (remoteStream.getAudioTracks()[0])
            remoteStream.getAudioTracks()[0].enabled = false;
        },
        unmute: async () => {
          if (remoteStream.getAudioTracks()[0])
            remoteStream.getAudioTracks()[0].enabled = true;
        },
        dispose: () => {},
      });
      this.broadcastStatus();
    });

    call.on("close", () => this.cleanupPeer(remotePeerId));
    call.on("error", () => this.cleanupPeer(remotePeerId));
  }

  private cleanupPeer(peerId: string) {
    this.audioSinkManager.detach(peerId);
    this.connections.delete(peerId);
    this.remoteStreams.delete(peerId);
    this.speakerDetector.detach(peerId);
    this.broadcastStatus();
  }

  private updateCombinedLocalStream(): void {
    if (!this.localStream) return;

    const audioTracks = this.localStream.getAudioTracks();
    const videoTracks = this.localVideoStream?.getVideoTracks() || [];

    if (videoTracks.length === 0) {
      if (!this.dummyVideoTrack) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, 1, 1);
        }
        const stream = (canvas as any).captureStream(1);
        this.dummyVideoTrack = stream.getVideoTracks()[0];
      }
      if (this.dummyVideoTrack) videoTracks.push(this.dummyVideoTrack);
    }

    if (!this.combinedLocalStream) {
      this.combinedLocalStream = new MediaStream([
        ...audioTracks,
        ...videoTracks,
      ]);
    } else {
      const current = this.combinedLocalStream.getTracks();
      const target = [...audioTracks, ...videoTracks];
      current.forEach((t) => {
        if (!target.includes(t)) this.combinedLocalStream?.removeTrack(t);
      });
      target.forEach((t) => {
        if (!current.includes(t)) this.combinedLocalStream?.addTrack(t);
      });
    }
  }

  private getCombinedLocalStream(): MediaStream | null {
    this.updateCombinedLocalStream();
    return this.combinedLocalStream;
  }

  private async triggerRenegotiation(pc: RTCPeerConnection): Promise<void> {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
    } catch (err) {
      console.error("[CallClient] Renegotiation failed:", err);
    }
  }

  private broadcastStatus(): void {
    const remoteStreamsByUser: Record<string, MediaStream> = {};
    const activeSpeakersByUser = new Set<string>();
    const screenShareStreamsByUser: Record<string, MediaStream> = {};

    for (const [peerId, stream] of this.remoteStreams.entries()) {
      const userId = this.getMappedUserId(peerId);
      if (userId) remoteStreamsByUser[userId] = stream;
    }

    for (const [peerId, call] of this.screenShareConnections.entries()) {
      const userId = this.getMappedUserId(peerId);
      if (userId) {
        const stream = this.remoteScreenShareStreams.get(peerId);
        if (stream) screenShareStreamsByUser[userId] = stream;
      }
    }

    for (const peerId of this.speakerDetector.getActiveSpeakerPeerIds()) {
      if (peerId === "local") {
        if (this.target?.userId) activeSpeakersByUser.add(this.target.userId);
        continue;
      }
      const userId = this.getMappedUserId(peerId);
      if (userId) activeSpeakersByUser.add(userId);
    }

    const audioTrack = this.localStream?.getAudioTracks()[0];
    const isMuted = audioTrack ? !audioTrack.enabled : true;

    this.callbacks?.onStatusChange({
      participantCount: this.connections.size + 1,
      remoteStreams: remoteStreamsByUser,
      localStream: this.getCombinedLocalStream(),
      activeSpeakers: Array.from(activeSpeakersByUser),
      isScreenSharing: this.isScreenSharing,
      screenShareStream: this.screenShareStream,
      screenShareStreams: screenShareStreamsByUser,
      availableDevices: this.availableDevices,
      selectedAudioDeviceId: this.selectedAudioDeviceId,
      selectedVideoDeviceId: this.selectedVideoDeviceId,
      isMuted,
      isVideoOn: !!this.localVideoStream,
    });
  }

  private initiateScreenShareCalls(): void {
    if (!this.peer || !this.screenShareStream) return;

    this.connections.forEach((_call, remotePeerId) => {
      this.initiateScreenShareCallToPeer(remotePeerId);
    });
  }

  private initiateScreenShareCallToPeer(remotePeerId: string): void {
    if (!this.peer || !this.screenShareStream) return;
    if (this.screenShareConnections.has(remotePeerId)) return;

    try {
      const screenCall = this.peer.call(remotePeerId, this.screenShareStream, {
        metadata: { type: "screen-share" },
      });
      if (!screenCall) return;

      this.screenShareConnections.set(remotePeerId, screenCall);

      screenCall.on("close", () => {
        this.screenShareConnections.delete(remotePeerId);
      });
      screenCall.on("error", () => {
        this.screenShareConnections.delete(remotePeerId);
      });
    } catch (err) {
      console.error("[CallClient] Failed to send screen share to peer:", err);
    }
  }

  private handleIncomingScreenShareCall(incomingCall: any): void {
    const remotePeerId = incomingCall.peer;

    const dummyStream = new MediaStream();
    incomingCall.answer(dummyStream);

    incomingCall.on("stream", (remoteScreenStream: MediaStream) => {
      this.remoteScreenShareStreams.set(remotePeerId, remoteScreenStream);
      this.screenShareConnections.set(remotePeerId, incomingCall);
      this.broadcastStatus();

      remoteScreenStream.onremovetrack = () => {
        this.remoteScreenShareStreams.delete(remotePeerId);
        this.screenShareConnections.delete(remotePeerId);
        this.broadcastStatus();
      };
    });

    incomingCall.on("close", () => {
      this.remoteScreenShareStreams.delete(remotePeerId);
      this.screenShareConnections.delete(remotePeerId);
      this.broadcastStatus();
    });
    incomingCall.on("error", () => {
      this.remoteScreenShareStreams.delete(remotePeerId);
      this.screenShareConnections.delete(remotePeerId);
      this.broadcastStatus();
    });
  }
}
