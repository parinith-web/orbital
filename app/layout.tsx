import "@/app/globals.css";

import { Bungee, DM_Sans, Galindo, Inter, Lexend } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { PresenceProvider } from "@/contexts/presenceContext";
import ConvexClientProvider from "./ConvexClientProvider";
import { cn } from "@/lib/utils";
import { getThemeBootstrapScript } from "@/lib/theme";
import { ColorProvider } from "@/contexts/colorContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { GlobalModals } from "@/components/layout/GlobalModals";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthHeader } from "@/components/layout/AuthHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Bungee — a chunky, road-sign-bold display face — powers the arcade
// marquee moments on the marketing landing page only (wordmark, big
// headlines, buttons): `font-display` in tailwind.config.ts. It never
// touches the app's own `font-sans`.
const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Orbital",
  description: "Realtime chat application",
  icons: {
    icon: "/assets/favicon.ico",
  },
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const galindo = Galindo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-galindo",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        inter.variable,
        dmSans.variable,
        lexend.variable,
        galindo.variable,
        bungee.variable,
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
        />
      </head>
      <body suppressHydrationWarning className={`body`}>
        <ClerkProvider
          localization={{
            signIn: {
              start: {
                title: "Orbital",
                subtitle: "Log in to your account",
              },
            },
            signUp: {
              start: {
                title: "Orbital",
                subtitle: "Create an account",
              },
            },
          }}
          appearance={{
            elements: {
              headerTitle: `text-white text-3xl font-semibold ${galindo.className}`,
              headerSubtitle: "text-gray-400",
            },
            layout: {
              unsafe_disableDevelopmentModeWarnings: true,
            },
            variables: {
              fontFamily: lexend.style.fontFamily,
            },
          }}
        >
          <AuthHeader />
          <div className="flex min-h-screen">
            <ConvexClientProvider>
              <Suspense>
                <TooltipProvider>
                  <PresenceProvider>
                    <ColorProvider>
                      <PreferencesProvider>
                        <GlobalModals />
                        <main className="flex-1 font-sans">{children}</main>
                        <Toaster
                          theme="dark"
                          position="top-center"
                          gap={12}
                          toastOptions={{
                            style: {
                              background: "hsl(var(--theme-bg-surface))",
                            },
                          }}
                        />
                      </PreferencesProvider>
                    </ColorProvider>
                  </PresenceProvider>
                </TooltipProvider>
              </Suspense>
            </ConvexClientProvider>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
