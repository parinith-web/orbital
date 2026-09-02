"use client";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { FullAppMock } from "@/components/mocks";
import { useColor } from "@/contexts/colorContext";

interface ThemingProps {
  colorDialog: boolean;
  setColorDialog: (val: boolean | ((v: boolean) => boolean)) => void;
}

export function Theming({ colorDialog, setColorDialog }: ThemingProps) {
  const { color, setColor } = useColor();

  return (
    <section className="relative pt-32 pb-16 md:pt-44 md:pb-16 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="max-w-3xl mb-6 flex flex-col ">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="font-display text-4xl max-w-[12ch] md:text-6xl text-white tracking-tight leading-[1.05]"
            >
              Theme As You Wish
            </motion.h2>

            <div className="mt-4 flex flex-col items-center">
              <div
                onClick={() => setColorDialog((v) => !v)}
                className="arcade-outline flex items-center gap-4 bg-white/5 py-2.5 px-5 rounded-2xl cursor-pointer transition-all group"
              >
                <span className="text-gray-300 text-sm select-none group-hover:text-white transition-colors">
                  Choose Accent Color
                </span>
                <div className="w-6 h-6 rounded-lg border-2 border-[#0b0b10] bg-theme-accent"></div>
              </div>
              {colorDialog &&
                createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setColorDialog(false)}
                    />
                    <div
                      className="arcade-outline arcade-shadow arcade-shadow-blue fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] p-4 bg-[#101010] rounded-2xl animate-in fade-in zoom-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HexColorPicker color={color} onChange={setColor} />
                      <button
                        onClick={() => setColorDialog(false)}
                        className="arcade-outline arcade-shadow arcade-press w-full mt-4 py-2 bg-arcade-yellow text-arcade-ink rounded-xl text-sm font-display uppercase tracking-wide transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </>,
                  document.body,
                )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full relative group"
          >
            <div className="flex items-center justify-center px-4 sm:px-6">
              <FullAppMock className="mx-auto" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
