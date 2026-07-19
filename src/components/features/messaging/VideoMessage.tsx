import { useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/skeletons/Skeleton";

export const VideoMessage = ({
  src,
  onLoadedData,
  onPreview,
}: {
  src: string;
  onLoadedData?: () => void;
  onPreview?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoadedData?.();
  };

  return (
    <div
      className="relative w-full aspect-video md:max-w-[500px] max-w-[300px] rounded-[12px] overflow-hidden cursor-pointer group/video bg-theme-surface border border-white/5"
      onClick={onPreview}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 z-20 bg-theme-hover animate-pulse" />
      )}

      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        className={`w-full h-full object-cover block transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoadedData={handleLoadedData}
      />

      {!isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/video:bg-black/20 transition-colors">
          <div className="w-12 h-12 rounded-full bg-theme-base/80 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-xl transform group-hover/video:scale-110 transition-transform">
            <HugeiconsIcon
              icon={PlayIcon}
              className="w-6 h-6 text-white ml-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};
