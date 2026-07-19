"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Cancel01Icon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon, 
  Download01Icon 
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useUIStore } from "@/store/uiStore";
import { useColor } from "@/contexts/colorContext";

export function MediaLightbox() {
  const { lightboxData, closeLightbox } = useUIStore();
  const { color } = useColor();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (lightboxData?.isOpen) {
      setCurrentIndex(lightboxData.startIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightboxData]);

  const items = lightboxData?.items || [];
  const currentItem = items[currentIndex];

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsZoomed(false);
    }
  }, [currentIndex]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsZoomed(false);
    }
  }, [currentIndex, items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxData?.isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxData?.isOpen, closeLightbox, handlePrev, handleNext]);

  useEffect(() => {
    if (lightboxData?.isOpen) {
      const activeThumb = document.getElementById(`thumb-${currentIndex}`);
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex, lightboxData?.isOpen]);

  if (!lightboxData?.isOpen || !currentItem) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = currentItem.file_url;
    link.download = currentItem.file_name || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200"
      onClick={closeLightbox}
    >
      {/* Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium truncate max-w-[200px] md:max-w-md">
            {currentItem.file_name || "Media Preview"}
          </span>
          <span className="text-white/50 text-xs">
            {currentIndex + 1} of {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-theme-hover rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>

          <button
            onClick={closeLightbox}
            className="p-2 hover:bg-theme-hover rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-50 p-2 hover:bg-theme-hover rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          </button>
        )}

        {currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-50 p-2 hover:bg-theme-hover rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
          </button>
        )}

        <div className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}>
          {currentItem.type.startsWith("video/") ? (
            <video
              src={currentItem.file_url}
              className="max-w-full max-h-full object-contain shadow-2xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="relative w-full h-full"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                src={currentItem.file_url}
                alt={currentItem.file_name || "media"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails / Bottom Info */}
      {items.length > 1 && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-theme-base rounded-xl z-50 max-w-[90vw] overflow-x-auto no-scrollbar scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              id={`thumb-${idx}`}
              onClick={() => {
                setCurrentIndex(idx);
                setIsZoomed(false);
              }}
              className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden transition-all duration-300 ${idx === currentIndex
                ? "opacity-100 z-10"
                : "opacity-40"
                }`}
            >
              {item.type.startsWith("video/") ? (
                <div className="w-full h-full relative">
                  <video src={item.file_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <Image
                  src={item.file_url}
                  alt="thumbnail"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              )}
              {idx === currentIndex && (
                <div
                  className="absolute inset-0 border border-gray-400 rounded-xl pointer-events-none"
                />
              )}
            </button>
          ))}
        </div>
      )
      }
    </div >
  );
}
