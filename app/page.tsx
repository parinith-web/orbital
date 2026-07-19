import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

// The marketing landing page has been removed. Signed-in users are sent
// straight into the portal; signed-out users are bounced to /login by the
// proxy (clerkMiddleware) since /portal is a protected route.
export default function Page() {
  redirect(ROUTES.PORTAL);
}
