const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatToIST(
  timestamp: Date | string | number | undefined,
): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const d = date.getDate();
  const m = monthsShort[date.getMonth()];
  const y = date.getFullYear();
  
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;

  return `${d} ${m} ${y}, ${h}:${min} ${ampm}`;
}

export function timeAgo(timestamp: number | string | Date | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return "just now";
}

export function isToday(date: Date | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isYesterday(date: Date | number): boolean {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

export function formatMessageDate(timestamp: number): string {
  if (isToday(timestamp)) {
    return formatTimeOnly(timestamp);
  }
  if (isYesterday(timestamp)) {
    return "Yesterday";
  }
  return formatToIST(timestamp);
}

export function formatDateFull(timestamp: Date | string | number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const d = date.getDate();
  const m = monthsFull[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

export function formatTimeOnly(timestamp: Date | string | number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function isSameDay(
  timestamp1: Date | string | number | undefined,
  timestamp2: Date | string | number | undefined,
): boolean {
  if (!timestamp1 || !timestamp2) return false;
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameMinute(
  timestamp1: Date | string | number | undefined,
  timestamp2: Date | string | number | undefined,
): boolean {
  if (!timestamp1 || !timestamp2) return false;
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate() &&
    date1.getHours() === date2.getHours() &&
    date1.getMinutes() === date2.getMinutes()
  );
}

export function formatDuration(startMs: number): string {
  const seconds = Math.floor((Date.now() - startMs) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}