import "@/app/globals.css";

import { DM_Sans, Galindo, Inter, Lexend } from "next/font/google";
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
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Portal",
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
                title: "Portal",
                subtitle: "Log in to your account",
              },
            },
            signUp: {
              start: {
                title: "Portal",
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
          <header className="fixed top-4 right-4 z-50 flex gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/portal">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/portal">
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
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
