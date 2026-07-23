export const ROUTES = {
  HOME: "/",
  PORTAL: "/portal",
  PORTAL_FRIENDS: "/portal/friends",
  PORTAL_ROOMS: "/portal/rooms",
  PORTAL_PROFILE: "/portal/profile",
  PORTAL_PREFERENCES: "/portal/preferences",
  PORTAL_ROOM: (roomId: string) => `/portal/room/${roomId}`,
  PORTAL_ANOMALY: "/portal/anomaly",
} as const;

export const ROUTE_KEYS = {
  HOME: "HOME",
  PORTAL: "PORTAL",
  PORTAL_FRIENDS: "PORTAL_FRIENDS",
  PORTAL_ROOMS: "PORTAL_ROOMS",
  PORTAL_PROFILE: "PORTAL_PROFILE",
  PORTAL_PREFERENCES: "PORTAL_PREFERENCES",
  PORTAL_ROOM: "PORTAL_ROOM",
  PORTAL_ANOMALY: "PORTAL_ANOMALY",
} as const;

export type RouteKey = (typeof ROUTE_KEYS)[keyof typeof ROUTE_KEYS];