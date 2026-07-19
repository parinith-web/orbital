"use client";

import { SidebarLayout, SidebarHeader } from "@/components/ui/sidebar";
import { MediaLightbox } from "@/components/ui/MediaLightbox";
import { useUIStore } from "@/store/uiStore";
import { MediaItem } from "@/components/ui/media";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SidebarMediaProps {
  mediaFiles: any[];
  isLoading: boolean;
  onClose: () => void;
}

export function SidebarMedia({
  mediaFiles,
  isLoading,
  onClose,
}: SidebarMediaProps) {
  const { openLightbox } = useUIStore();

  const images = mediaFiles?.filter((m) => m.type?.startsWith("image/")) || [];
  const videos = mediaFiles?.filter((m) => m.type?.startsWith("video/")) || [];
  const files =
    mediaFiles?.filter(
      (m) => !m.type?.startsWith("image/") && !m.type?.startsWith("video/"),
    ) || [];

  const handleImageClick = (media: any) => {
    const mediaItems = images.map((m: any) => ({
      file_url: m.file_url,
      type: m.type,
      file_name: m.file_name,
    }));
    const index = images.findIndex((m: any) => m._id === media._id);
    openLightbox(mediaItems, index >= 0 ? index : 0);
  };

  const handleVideoClick = (media: any) => {
    const mediaItems = videos.map((m: any) => ({
      file_url: m.file_url,
      type: m.type,
      file_name: m.file_name,
    }));
    const index = videos.findIndex((m: any) => m._id === media._id);
    openLightbox(mediaItems, index >= 0 ? index : 0);
  };

  return (
    <SidebarLayout>
      <SidebarHeader title="Media Gallery" onClose={onClose} />
      <MediaLightbox />

      <Tabs defaultValue="images" className="flex flex-col flex-1 min-h-0 p-2">
        <TabsList>
          <TabsTrigger value="images" className="px-3 py-1 rounded-[6px]" />
          <TabsTrigger value="videos" className="px-3 py-1 rounded-[6px]" />
          <TabsTrigger value="files" className="px-3 py-1 rounded-[6px]" />
        </TabsList>

        <TabsContent
          value="images"
          className="flex-1 p-4 overflow-y-auto no-scrollbar"
        >
          {images.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-xs">No images yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((media: any) => (
                <MediaItem
                  key={media._id}
                  fileUrl={media.file_url}
                  fileName={media.file_name}
                  fileSize={media.file_size}
                  type={media.type}
                  onClick={() => handleImageClick?.(media)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="videos"
          className="flex-1 p-4 overflow-y-auto no-scrollbar"
        >
          {videos.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-xs">No videos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {videos.map((media: any) => (
                <MediaItem
                  key={media._id}
                  fileUrl={media.file_url}
                  fileName={media.file_name}
                  fileSize={media.file_size}
                  type={media.type}
                  onClick={() => handleVideoClick?.(media)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="files"
          className="flex-1 p-4 overflow-y-auto no-scrollbar"
        >
          {files.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-xs">No files yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((media: any) => (
                <MediaItem
                  key={media._id}
                  fileUrl={media.file_url}
                  fileName={media.file_name}
                  fileSize={media.file_size}
                  type={media.type}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
}
