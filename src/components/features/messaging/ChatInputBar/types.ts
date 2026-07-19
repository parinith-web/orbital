export interface ChatInputBarProps {
  room_id: string;
  type: "room" | "direct";
  color: string;
  textColor: string;
  scrollToBottom: () => void;
}

export interface UploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  storageId: string | null;
}

export type UploadAction =
  | { type: "START"; file: File }
  | { type: "PROGRESS"; progress: number }
  | { type: "DONE"; storageId: string }
  | { type: "RESET" };
