import { Skeleton } from "./Skeleton";

export default function PortalShellSkeleton({
  showNotifications = true,
}: {
  showNotifications?: boolean;
}) {
  return (
    <div className="flex min-h-screen text-white">
      <div className="hidden md:flex w-64 border-r border-theme-border bg-theme-base px-2 py-2">
        <div className="flex w-full flex-col items-center gap-3">
          <Skeleton className="h-10 w-60 rounded-[8px]" />
          <Skeleton className="h-[80px] w-60 rounded-[8px]" />
          <Skeleton className="h-[24px] w-[240px] rounded-[4px]" />
          <div className="flex w-full flex-col gap-2 px-2">
            <Skeleton className="h-12 w-full rounded-[8px]" />
            <Skeleton className="h-12 w-full rounded-[8px]" />
            <Skeleton className="h-12 w-full rounded-[8px]" />
          </div>
          <Skeleton className="mt-auto h-16 w-60 rounded-[8px]" />
        </div>
      </div>

      {/* <div className="flex flex-1">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-theme-border bg-theme-base px-4 py-1 md:py-3">
            <Skeleton className="h-6 w-28 rounded-[6px]" />
            <Skeleton className="h-7 w-10 rounded-[8px]" />
          </div>
          <div className="flex-1 p-3">
            <div className="flex flex-col gap-5">
              <div className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-1/3 rounded-[4px]" />
                  <Skeleton className="h-3 w-1/2 rounded-[4px]" />
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-1/4 rounded-[4px]" />
                  <Skeleton className="h-3 w-2/3 rounded-[4px]" />
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-1/2 rounded-[4px]" />
                  <Skeleton className="h-3 w-1/3 rounded-[4px]" />
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-1/3 rounded-[4px]" />
                  <Skeleton className="h-3 w-1/4 rounded-[4px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showNotifications && (
          <div className="hidden md:flex w-[360px] flex-col border-l border-theme-border bg-theme-base">
            <div className="flex items-center justify-between border-b border-theme-border px-4 py-1 md:py-3">
              <Skeleton className="h-6 w-28 rounded-[6px]" />
              <Skeleton className="h-7 w-12 rounded-[8px]" />
            </div>
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-[92px] rounded-[14px]" />
              <Skeleton className="h-[92px] rounded-[14px]" />
              <Skeleton className="h-[92px] rounded-[14px]" />
            </div>
          </div>
        )}
      </div> */}
    </div>
  );
}
