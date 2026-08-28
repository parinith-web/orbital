import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ROUTES } from "@/lib/constants/routes";
import { LandingPage } from "@/components/features/marketing/LandingPage";

// Restores the marketing landing page for signed-out visitors (previously
// removed — every visit to "/" used to redirect straight to /orbital,
// which just bounced signed-out users on to /login via the proxy's
// clerkMiddleware, since /orbital is a protected route). Signed-in
// visitors keep the old behavior exactly: straight into the orbital,
// never shown the pitch again.
export default async function Page() {
  const { userId } = await auth();
  if (userId) {
    redirect(ROUTES.ORBITAL);
  }
  return <LandingPage />;
}
