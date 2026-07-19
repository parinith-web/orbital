import { Skeleton } from "./Skeleton";

export const ChatSkeleton = () => {
  return (
    <div className="flex flex-col gap-10 py-8 md:px-10 px-6 w-full h-full">
      {[
        [500, 400, 600],
        [500, 400],
        [500, 400, 300, 600],
        [500, 400, 300],
      ].map((widths, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="rounded-[8px] h-9 w-9 flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1 items-start">
            {widths.map((w, j) => (
              <Skeleton
                key={j}
                className="h-7 w-full rounded-[6px]"
                style={{ maxWidth: `${w}px` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
