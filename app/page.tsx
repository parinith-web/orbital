import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

// The marketing landing page has been removed. Signed-in users are sent
// straight into the orbital; signed-out users are bounced to /login by the
// proxy (clerkMiddleware) since /orbital is a protected route.
export default function Page() {
  redirect(ROUTES.ORBITAL);
}
