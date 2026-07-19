import { useReducer, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { validateFile } from "@/lib/utils/file";
import type { UploadState, UploadAction } from "./types";

const initialUploadState: UploadState = {
  file: null,
  isUploading: false,
  progress: 0,
  storageId: null,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        file: action.file,
        isUploading: true,
        progress: 0,
        storageId: null,
      };
    case "PROGRESS":
      return { ...state, progress: action.progress };
    case "DONE":
      return { ...state, isUploading: false, storageId: action.storageId };
    case "RESET":
      return initialUploadState;
    default:
      return state;
  }
}

export function useFileUpload(generateUploadUrl: () => Promise<string>) {
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const previewUrl = useMemo(() => {
    if (!state.file) return null;
    if (state.file.type.startsWith("image/")) {
      return URL.createObjectURL(state.file);
    }
    return null;
  }, [state.file]);

  // Cleanup object URLs when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl as string);
    };
  }, [previewUrl]);

  const startUpload = useCallback(
    async (file: File) => {
      dispatch({ type: "START", file });

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const uploadUrl = await generateUploadUrl();
        const storageId = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              dispatch({ type: "PROGRESS", progress });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText).storageId);
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.onabort = () => reject(new Error("Upload aborted"));

          xhr.send(file);

          abortControllerRef.current?.signal.addEventListener("abort", () => {
            xhr.abort();
          });
        });

        dispatch({ type: "DONE", storageId });
      } catch (error: any) {
        if (error?.message !== "Upload aborted") {
          console.error(error);
          toast.error("File upload failed");
          dispatch({ type: "RESET" });
        }
      }
    },
    [generateUploadUrl],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      startUpload(file);
    },
    [startUpload],
  );

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    dispatch({ type: "RESET" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return {
    upload: state,
    startUpload,
    handleFileSelect,
    cancelUpload,
    previewUrl,
    fileInputRef,
  } as const;
}
