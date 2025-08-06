"use client";

// TODO: Replace dynamicMotion with CSS animation.

import CompanyLogo from "../companyLogos/CompanyLogo";
import { useTheme } from "../ThemeProvider";
import { MotionDiv, MotionSpan } from "../dynamicMotion";

export function GeneratingAnswer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // pick the dot color based on theme
  const dotBg = isDark ? "bg-accent/60" : "bg-accent/90";

  return (
    <div className="px-1 py-5 max-w-screen-md">
      <div className="flex justify-center items-center space-x-2">
        <span
          className={`w-2 h-2 rounded-full ${dotBg}`}
          style={{
            animation: "loadingDot 1.4s infinite ease-in-out both",
            animationDelay: "0s",
          }}
        />
        <span
          className={`w-2 h-2 rounded-full ${dotBg}`}
          style={{
            animation: "loadingDot 1.4s infinite ease-in-out both",
            animationDelay: "0.2s",
          }}
        />
        <span
          className={`w-2 h-2 rounded-full ${dotBg}`}
          style={{
            animation: "loadingDot 1.4s infinite ease-in-out both",
            animationDelay: "0.4s",
          }}
        />
      </div>

      {/* inject keyframes globally */}
      <style jsx global>{`
        @keyframes loadingDot {
          0%,
          80%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          40% {
            transform: scale(1.5);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

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
            w-9 h-9 shrink-0 grow-0 rounded-full flex items-center justify-center relative
            ${
              isDark
                ? "border border-accent/30 bg-accent/10"
                : "border border-accent/50 bg-accent/5"
            }
          `}
          >
            {/* Pulsing ring animation */}
            <MotionDiv
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
              className="h-[70%] w-[auto] z-10"
            />
          </div>
        </div>

        <div className="flex-auto"></div>

        <div className="flex-none">
          {/* Loading indicator */}
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              {/* Status text */}
              <MotionDiv
                className={`text-xs ${isDark ? "text-foreground/70" : "text-foreground/60"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <MotionSpan
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
                </MotionSpan>
              </MotionDiv>

              {hasAttachments && (
                <MotionDiv
                  className={`text-xs ${isDark ? "text-foreground/70" : "text-foreground/60"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <MotionSpan
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
                  </MotionSpan>
                </MotionDiv>
              )}

              {/* Progress bar */}
              <MotionDiv
                className={`
                h-0.5 mt-1 w-32 overflow-hidden rounded-full
                ${isDark ? "bg-muted/20" : "bg-muted/40"}
              `}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <MotionDiv
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
              </MotionDiv>
            </div>
          </div>
        </div>

        <div className="flex-auto"></div>
      </div>
    </div>
  );
}
