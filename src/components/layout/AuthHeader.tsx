"use client";

import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, Show } from "@clerk/nextjs";

/**
 * Fixed top-right Sign In / Sign Up buttons, shown on every route except
 * the marketing landing page ("/"), which has its own Navbar with an
 * "Enter" CTA that already covers this.
 */
export function AuthHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="fixed top-4 right-4 z-50 flex gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/orbital">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl="/orbital">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Sign Up
          </button>
        </SignUpButton>
      </Show>
    </header>
  );
}
