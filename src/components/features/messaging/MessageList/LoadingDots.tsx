import { DotmSquare19 } from "@/components/ui/dotm-square-19";

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center py-6">
      <DotmSquare19
        size={26}
        dotSize={4}
        speed={1.2}
        color="#ffffff"
        bloom
      />
    </div>
  );
}
