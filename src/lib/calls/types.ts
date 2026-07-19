export type CallTrackType = "audio" | "video";

export interface CallTrack {
  id: string;
  participantId: string;
  type: CallTrackType;
  stream: MediaStream;
  track: MediaStreamTrack;
  isMuted: () => boolean;
  mute: () => Promise<void>;
  unmute: () => Promise<void>;
  dispose: () => void;
}