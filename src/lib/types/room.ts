import type { User } from "./user";

export interface UserRoom {
  room_id: string;
  memberCount: number;
  Rooms?: {
    room_name?: string;
    room_id?: string;
  } | null;
  owner_id?: string | null;
  joined_at?: number;
}

export interface RoomMemberWithUser {
  _id?: string;
  _creationTime?: number;
  room_id: string;
  user_id: string;
  role?: string;
  username?: string;
  avatar?: string;
  notificationPreference?: string;
  Users?: {
    user_id: string;
    username: string;
    avatar?: string;
    _creationTime?: number;
  };
}
