export const ROUTES = {
  HOME: "/",
  ORBITAL: "/orbital",
  ORBITAL_FRIENDS: "/orbital/friends",
  ORBITAL_ROOMS: "/orbital/rooms",
  ORBITAL_SETTINGS: "/orbital/settings",
  /** @deprecated use ORBITAL_SETTINGS — Profile and Preferences were merged into one Settings tab. Kept only so old links redirect. */
  ORBITAL_PROFILE: "/orbital/profile",
  /** @deprecated use ORBITAL_SETTINGS — Profile and Preferences were merged into one Settings tab. Kept only so old links redirect. */
  ORBITAL_PREFERENCES: "/orbital/preferences",
  ORBITAL_ROOM: (roomId: string) => `/orbital/room/${roomId}`,
  ORBITAL_ANOMALY: "/orbital/anomaly",
} as const;

export const ROUTE_KEYS = {
  HOME: "HOME",
  ORBITAL: "ORBITAL",
  ORBITAL_FRIENDS: "ORBITAL_FRIENDS",
  ORBITAL_ROOMS: "ORBITAL_ROOMS",
  ORBITAL_SETTINGS: "ORBITAL_SETTINGS",
  ORBITAL_PROFILE: "ORBITAL_PROFILE",
  ORBITAL_PREFERENCES: "ORBITAL_PREFERENCES",
  ORBITAL_ROOM: "ORBITAL_ROOM",
  ORBITAL_ANOMALY: "ORBITAL_ANOMALY",
} as const;

export type RouteKey = (typeof ROUTE_KEYS)[keyof typeof ROUTE_KEYS];