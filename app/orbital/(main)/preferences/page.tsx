import { redirect } from "next/navigation";

// Profile and Preferences were merged into a single Settings tab
// (`/orbital/settings`, with an internal Profile/Preferences sub-tab
// switcher — see app/orbital/(main)/settings/page.tsx). This route is kept
// as a redirect only so old links/bookmarks to /orbital/preferences still
// land somewhere sensible instead of 404ing.
export default function PreferencesPageRedirect() {
  redirect("/orbital/settings");
}
