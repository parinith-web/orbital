import { Skeleton } from "./Skeleton";
export const ListSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="md:h-[24px] mt-2 md:w-[268px] rounded-[4px]" />
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="rounded-[8px] w-9 h-9" />
          <div className="flex flex-col ">
            <Skeleton className="md:h-[26px] mt-2 md:w-[210px] rounded-[4px]" />
            <Skeleton className="md:h-[12px] mt-2 md:w-[140px] rounded-[4px]" />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="rounded-[8px] w-9 h-9" />
          <div className="flex flex-col ">
            <Skeleton className="md:h-[26px] mt-2 md:w-[210px] rounded-[4px]" />
            <Skeleton className="md:h-[12px] mt-2 md:w-[140px] rounded-[4px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
