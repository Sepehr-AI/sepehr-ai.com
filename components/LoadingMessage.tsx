"use client";

import { motion } from "framer-motion";
import CompanyLogo from "./companyLogos/CompanyLogo";
import { useTheme } from "../components/ThemeProvider";

export default function LoadingMessage({
  aiCompanyWebsite,
  hasAttachments = false,
}: {
  hasAttachments?: boolean;
  aiCompanyWebsite: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="px-1 py-10 max-w-screen-md">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-none">
          <div
            className={`
            w-9 h-9 rounded-full flex items-center justify-center relative
            ${
              isDark
                ? "border border-accent/30 bg-accent/10"
                : "border border-accent/50 bg-accent/5"
            }
          `}
          >
            {/* Pulsing ring animation */}
            <motion.div
              className={`
                absolute inset-0 rounded-full
                ${isDark ? "bg-accent/20" : "bg-accent/10"}
              `}
              animate={{
                scale: [1, 1.2, 1],
                opacity: isDark ? [0.1, 0.3, 0.1] : [0.05, 0.2, 0.05],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <CompanyLogo
              companyWebsite={aiCompanyWebsite}
              className="h-5 w-5 z-10"
            />
          </div>
        </div>

        <div className="flex-auto"></div>

        <div className="flex-none">
          {/* Loading indicator */}
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              {/* Status text */}
              <motion.div
                className={`text-xs ${isDark ? "text-foreground/70" : "text-foreground/60"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.span
                  className="text-center"
                  animate={{
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  در حال تولید پاسخ ...
                </motion.span>
              </motion.div>

              {hasAttachments && (
                <motion.div
                  className={`text-xs ${isDark ? "text-foreground/70" : "text-foreground/60"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.span
                    className="text-center"
                    animate={{
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  >
                    (پردازش طولانی‌تر به دلیل آپلود فایل)
                  </motion.span>
                </motion.div>
              )}

              {/* Progress bar */}
              <motion.div
                className={`
                h-0.5 mt-1 w-32 overflow-hidden rounded-full
                ${isDark ? "bg-muted/20" : "bg-muted/40"}
              `}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <motion.div
                  className={`h-full rounded-full ${isDark ? "bg-accent/50" : "bg-accent/60"}`}
                  initial={{ width: "0%" }}
                  animate={{
                    width: ["0%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="flex-auto"></div>
      </div>
    </div>
  );
}
