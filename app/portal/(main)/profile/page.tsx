import { redirect } from "next/navigation";

// Profile and Preferences were merged into a single Settings tab
// (`/portal/settings`, with an internal Profile/Preferences sub-tab
// switcher — see app/portal/(main)/settings/page.tsx). This route is kept
// as a redirect only so old links/bookmarks to /portal/profile still land
// somewhere sensible instead of 404ing.
export default function ProfilePageRedirect() {
  redirect("/portal/settings");
}
