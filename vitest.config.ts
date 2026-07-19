import { defineConfig } from "vitest/config";

// D2c: minimal vitest setup so `convex/**/*.test.ts` files can run against
// convex-test's simulated backend (real transaction locking/serialization,
// not a hand-rolled mock) instead of staying typecheck-only forever like
// everything since B1. Convex functions assume the V8 "edge" runtime
// (no Node builtins), so convex-test's own docs specify this environment —
// using Node's default here would let subtly-wrong code pass locally and
// fail on a real deployment.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
