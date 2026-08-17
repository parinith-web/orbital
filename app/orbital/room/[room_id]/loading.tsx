export default function Loading() {
  return (
    <div className="w-[850px] h-[80vh] px-4 py-6 flex flex-col gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`h-8 w-[60%] rounded-xl animate-pulse ${
            i % 2 === 0 ? "bg-gray-300" : "bg-blue-300 self-end"
          }`}
        />
      ))}
    </div>
  );
}
