"use client";

import Icon from "./landing/Icon";
import { motion } from "framer-motion";
import { useTheme } from "../components/ThemeProvider";

export default function Loading() {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 flex flex-col h-full w-full">
      <div className="flex-auto"></div>
      <div className="flex-none flex items-center justify-center bg-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 z-10"
        >
          {/* App logo with spinning ring */}
          <div className="relative">
            <Icon
              fill={theme === "dark" ? "#fff" : "#000"}
              className="h-12 w-auto relative"
            />
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center text-center">
            <p className="text-foreground text-xl font-medium">
              در حال بارگذاری
            </p>
            <p className="text-foreground/60 text-sm mt-1">
              لطفا چند لحظه صبر کنید ...
            </p>
          </div>

          {/* Animated dots */}
          <div className="flex space-x-2 mt-2">
            <motion.div
              className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-accent/80" : "bg-accent"}`}
              animate={{ scale: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-accent/80" : "bg-accent"}`}
              animate={{ scale: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-accent/80" : "bg-accent"}`}
              animate={{ scale: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>

          {/* Progress bar */}
          <div
            className={`w-72 h-1 rounded-full overflow-hidden ${theme === "dark" ? "bg-muted/30" : "bg-muted"}`}
          >
            <motion.div
              className="h-full bg-accent"
              initial={{ width: "0%" }}
              animate={{
                width: ["0%", "100%"],
                x: ["-100%", "0%"],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>
      </div>
      <div className="flex-auto"></div>
    </div>
  );
}
