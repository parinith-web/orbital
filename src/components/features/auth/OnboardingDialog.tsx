"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useUserProfileActions } from "@/hooks";
import { toast } from "sonner";
import { Galindo } from "next/font/google";
import Starfield from "@/components/effects/Starfield";
import { AvatarMaker } from "@/components/avatar";
import {
  type AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  encodeAvatarConfig,
} from "@/lib/avatar/options";

const galindo = Galindo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-galindo",
  display: "swap",
});

interface OnboardingDialogProps {
  onComplete: () => void;
}

export const OnboardingDialog = ({ onComplete }: OnboardingDialogProps) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [avatarCode, setAvatarCode] = useState(() =>
    encodeAvatarConfig(DEFAULT_AVATAR_CONFIG),
  );
  const [isFinishing, setIsFinishing] = useState(false);

  const { createUser } = useUserProfileActions();

  const handleAvatarChange = (_config: AvatarConfig, code: string) => {
    setAvatarCode(code);
  };

  const handleFinish = async () => {
    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setIsFinishing(true);
    try {
      await createUser({ username, avatar: avatarCode });
      toast.success("Welcome to Orbital!");
      onComplete();
    } catch {
      toast.error("Failed to create profile");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-[url('/assets/asciiHero.png')] bg-cover bg-center fade-slow opacity-40 -z-10" />
        <Starfield
          starColor={[255, 255, 255]}
          density={1.1}
          speed={12}
          direction={35}
          mouseRadius={110}
          repelStrength={90}
          twinkle
        />
      </div>
      <div
        className={`relative w-full bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${
          step === 2 ? "max-w-3xl" : "max-w-lg"
        }`}
      >

        <motion.div
          layout
          initial={false}
          className="relative overflow-hidden"
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.2 }
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col justify-center p-12 gap-12"
              >

                <div className="flex flex-col items-center text-center px-8 gap-6">
                  <div>
                    <h1
                      className={`${galindo.className} text-3xl font-bold text-white mb-2`}
                    >
                      Orbital
                    </h1>
                    <p className="text-gray-300">Let's get your profile set up.</p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-black bg-white hover:bg-gray-200 py-4 px-8 flex text-sm items-center gap-1 ease-in-out hover:brightness-110 hover:opacity-90 rounded-xl"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex flex-col space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Build your avatar
                    </h2>
                    <p className="text-sm text-gray-300">
                      Mix a color, eyes, mouth, and a hat. You can always
                      change it later from Settings.
                    </p>
                  </div>

                  <AvatarMaker
                    initialConfig={DEFAULT_AVATAR_CONFIG}
                    onChange={handleAvatarChange}
                    hideSaveControls
                  />

                  <div className="flex gap-2 items-center w-full max-w-sm mx-auto">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 bg-[#272727] hover:text-gray-200 duration-200 transition-all text-sm text-white py-3 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="bg-white text-black justify-center flex-1 text-sm py-3 px-6 flex items-center gap-1 ease-in-out hover:brightness-110 hover:opacity-90 rounded-xl"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="p-8"
              >
                <div className="flex flex-col space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Set up your profile
                    </h2>
                    <p className="text-sm text-gray-300">
                      This is how others will see you.
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-full space-y-2 flex flex-col">
                      <span className="text-xs text-gray-300 pl-1">Username</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Otus"
                        className="w-[100%] outline-none border placeholder-white/20 border-theme-border rounded-[8px] text-[#e3e3e3] bg-[#272727] py-2 px-3"
                      />
                      <span className="text-xs text-white/40 pl-1">Minimum 3 characters</span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center w-full">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 px-6 bg-[#272727] hover:text-gray-200 duration-200 transition-all text-sm text-white py-3 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      disabled={!username || username.length < 3 || isFinishing}
                      onClick={handleFinish}
                      className="bg-white text-black justify-center flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm py-3 px-6 flex items-center gap-1 ease-in-out hover:brightness-110 hover:opacity-90 rounded-xl"
                    >
                      {isFinishing ? (
                        <div className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Finish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
