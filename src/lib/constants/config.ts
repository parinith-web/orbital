export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

export const CONVEX_CONFIG = {
  deployment: process.env.NEXT_PUBLIC_CONVEX_DEPLOYMENT,
} as const;

export const APP_CONFIG = {
  defaultChatColor: "#4a31b0",
  storageKey: "chatColor",
  maxFileSizeBytes: 50 * 1024 * 1024, // Increased to 50MB for better file support
  messagePageSize: 10,
  typingDebounceMs: 1000,
  presenceUpdateIntervalMs: 60 * 1000,
} as const;

export const CONVEX_DEPLOYMENT = process.env.NEXT_PUBLIC_CONVEX_DEPLOYMENT;

export const SCROLL_CONFIG = {
  // px from bottom — within this range, user is considered "at bottom"
  nearBottomThreshold: 100,
  // px from top — when scrollTop drops below this, fire the onNearTop callback
  nearTopThreshold: 300,
  // ms to wait after a scroll-to-message before re-enabling scroll checks
  scrollSettleDelayMs: 200,
  // ms to debounce near-top / near-bottom callbacks
  scrollCallbackDebounceMs: 150,
} as const;

export const PAGINATION_CONFIG = {
  // Messages per page — balances load time vs scroll frequency
  messagesPerPage: 50,
  // Max messages in window — beyond this, DOM rendering degrades
  maxWindowSize: 150,
  // How long the yellow highlight persists after jump-to-message
  highlightDurationMs: 2000,
} as const;
