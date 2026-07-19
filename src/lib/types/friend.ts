import type { Id } from "@/convex/_generated/dataModel";
import type { User } from "./user";

export type FriendStatus = "pending" | "accepted";

export interface Friend {
  _id: Id<"friends">;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
  last_msg?: string;
  updated_at?: number;
  _creationTime: number;
}

export interface FriendWithUser extends Friend {
  friend?: User | null;
}

export interface FriendRequest {
  senderId: string;
  receiverId: string;
  status: FriendStatus;
}

export interface SendFriendRequestArgs {
  friend_id: string;
}

export interface AcceptFriendRequestArgs {
  friend_id: string;
}

export interface RemoveFriendArgs {
  friend_id: string;
}
