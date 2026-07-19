export const ROUTES = {
  HOME: "/",
  PORTAL: "/portal",
  PORTAL_PROFILE: "/portal/profile",
  PORTAL_ROOM: (roomId: string) => `/portal/room/${roomId}`,
  PORTAL_SIGNAL: "/portal/signal",
} as const;

export const ROUTE_KEYS = {
  HOME: "HOME",
  PORTAL: "PORTAL",
  PORTAL_PROFILE: "PORTAL_PROFILE",
  PORTAL_ROOM: "PORTAL_ROOM",
  PORTAL_SIGNAL: "PORTAL_SIGNAL",
} as const;

export type RouteKey = (typeof ROUTE_KEYS)[keyof typeof ROUTE_KEYS];