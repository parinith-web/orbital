import { Galindo } from "next/font/google";

const galindo = Galindo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-galindo",
});

export function RoomAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] ${galindo.className} text-md text-[#585858] flex items-center justify-center bg-white opacity-90  ${className}`}
    >
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}
