import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

interface NavbarProps {
  scrolled: boolean;
  handleEnter: () => void;
}

export function Navbar({ scrolled, handleEnter }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = (
    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-3">
      <button
        onClick={() =>
          window.open("https://github.com/vmridul/orbital", "_blank")
        }
        className="arcade-outline arcade-shadow arcade-shadow-blue arcade-press flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all bg-[#1a1a20] hover:bg-arcade-pink hover:text-white text-gray-200 w-full md:w-auto justify-center"
      >
        <Image
          src="/assets/github-icon-white.webp"
          alt="Git"
          width={20}
          height={20}
        />
        <span className="md:hidden">GitHub</span>
      </button>

      <button
        onClick={() => {
          handleEnter();
          setIsOpen(false);
        }}
        className="arcade-outline arcade-shadow arcade-shadow-blue arcade-press flex items-center justify-center rounded-xl bg-[#1a1a20] px-5 py-2 text-sm font-display uppercase tracking-wide text-white hover:bg-arcade-pink hover:text-white w-full md:w-auto"
      >
        Enter
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-[100] w-full bg-black/35 backdrop-blur-md transition-colors duration-300 ${
        scrolled || isOpen
          ? "border-b border-white/10 py-0"
          : "border-b border-white/5 py-2"
      }`}
    >
      <div className="flex justify-between items-center px-6 py-4 max-w-6xl w-[90%] mx-auto">
        <div className="flex items-center gap-3">
          <span className="arcade-outline arcade-shadow arcade-shadow-blue flex items-center justify-center rounded-xl bg-[#1a1a20] px-4 py-2 font-display text-lg text-white tracking-wide [-webkit-text-stroke:1.5px_#0b0b10] [paint-order:stroke_fill]">
            Orbital
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">{navItems}</div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="arcade-outline arcade-shadow arcade-shadow-blue arcade-press md:hidden flex items-center justify-center p-2 rounded-xl bg-[#1a1a20] text-white/80 hover:text-white transition-colors"
        >
          <HugeiconsIcon icon={isOpen ? Cancel01Icon : Menu01Icon} size={22} />
        </button>
      </div>

      {/* Mobile Menu Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-black/50 backdrop-blur-md overflow-hidden"
          >
            <div className="px-6 pb-4 flex flex-col gap-6">{navItems}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
