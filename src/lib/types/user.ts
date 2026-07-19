import type { Id } from "@/convex/_generated/dataModel";

export type UserId = string;

export interface User {
  user_id: string;
  username: string;
  avatar?: string;
  email?: string;
  chatColor?: string;
  _creationTime?: number;
}

export interface UserWithPresence extends User {
  presenceStatus?: PresenceStatus;
}

export type PresenceStatus = "online" | "away";

export interface Presence {
  user_id: string;
  status: PresenceStatus;
  updated_at: number;
}

export type { Id };