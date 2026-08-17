"use client";
import { SignUp } from "@clerk/nextjs";
import { Lexend } from "next/font/google";
import PixelBlast from "@/components/effects/PixelBlast";

const lexend = Lexend({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export default function SignUpPage() {
  return (
    <div className="selection:bg-white/10 min-h-screen w-full bg-theme-base flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0"><PixelBlast
        variant="square"
        pixelSize={3}
        color="#505050"
        patternScale={2}
        patternDensity={1}
        enableRipples
        rippleSpeed={0.3}
        rippleThickness={0.1}
        rippleIntensityScale={1}
        speed={0.5}
        transparent
        edgeFade={0.1}
      /></div>
      <div className="relative z-10 w-full max-w-md p-4">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/orbital"
          appearance={{
            elements: {
              rootBox: "bg-[#101010] rounded-xl",
              card: "bg-[#101010] shadow-none border-none",
              main: "bg-[#101010]",

              headerTitle: "text-white font-semibold",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-[#242424] hover:bg-[#242424] border border-[#242424] text-white hover:text-white",
              socialButtonsBlockButtonText: "text-white",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-[#272727] border border-[#242424] rounded-lg text-white placeholder-[#666]",
              formButtonPrimary: "bg-[#ffffff] hover:bg-gray-200 text-black rounded-lg",
              footerText: "text-white",
              dividerLine: "bg-[#242424]",
              dividerText: "text-gray-400",
              identityPreviewText: "text-white",
              formFieldInputShowPasswordButton: "text-gray-400",
              footer: "bg-[#101010]",
              footerAction: "bg-[#101010",
              footerActionLink: "text-gray-300",
              footerActionText: "text-white",
              footerPageLink: "text-gray-200",
              otpCodeFieldInput: "bg-[#272727] border border-[#242424] text-white rounded-lg",
              formFieldInputShowPasswordButtonText: "text-white",
              alternativeMethodsText: "text-gray-300",
              enterpriseBrandedSwitchText: "text-gray-300",
              formFieldAction: "text-white",
              backLink: "text-gray-300 hover:text-white",
              otpCodeFieldInputGroupText: "text-white",
              alternativeMethodsTextButton: "text-white",
              lastAuthenticationStrategyBadge: "bg-gray-200 text-black"
            },
            variables: {
              colorPrimary: "white",
              colorBackground: "#101010",
              colorTextOnPrimary: "#101010",
              colorInputBackground: "#272727",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#a0a0a0",
              colorDanger: "#ef4444",
              colorSuccess: "#22c55e",
              fontFamily: lexend.style.fontFamily,
              fontSize: "14px",
              borderRadius: "8px",
              spacingUnit: "8px",
            },
          }}

        />
      </div>
    </div>
  );
}
