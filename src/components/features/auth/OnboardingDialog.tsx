"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useUserProfileActions } from "@/hooks";
import { toast } from "sonner";
import { Galindo } from "next/font/google";
import Dither from "@/components/effects/Dither";

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
  const [avatar, setAvatar] = useState("/assets/defaultAvatar.png");
  const [isUploading, setIsUploading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { createUser, generateUploadUrl, getUrl } = useUserProfileActions();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const newAvatarUrl = await getUrl(storageId);
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        toast.success("Avatar uploaded");
      }
    } catch (e) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = async () => {
    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setIsFinishing(true);
    try {
      await createUser({ username, avatar });
      toast.success("Welcome to Orbital!");
      onComplete();
    } catch (e) {
      toast.error("Failed to create profile");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[url('/assets/asciiHero.png')] bg-cover bg-center fade-slow opacity-40 -z-10" >
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          pixelSize={2}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.01}
        /></div>
      <div className="relative w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

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
            ) : (
              <motion.div
                key="step2"
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
                    <div
                      className="relative group cursor-pointer flex flex-col gap-1"
                      onClick={() => !isUploading && fileRef.current?.click()}
                    >
                      <span className="text-xs text-gray-300 pl-1">Avatar</span>
                      <div className="relative w-24 h-24 rounded-3xl overflow-hidden border border-theme-border transition-colors">
                        <Image
                          src={avatar}
                          alt="Avatar"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <HugeiconsIcon icon={Upload01Icon} className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </div>

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
                      onClick={() => setStep(1)}
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
