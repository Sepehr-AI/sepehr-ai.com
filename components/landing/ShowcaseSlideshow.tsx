"use client";

import type { ImageModelPricingDto } from "@/lib/imageModels";
import { modelCodeToShowCaseUrl } from "@/lib/url";
import type { VideoModelPricingDto } from "@/lib/videoModels";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* eslint-disable @next/next/no-img-element */

type Slide = {
  key: string;
  title: string;
  src: string;
  poster?: string;
  type: "image" | "video";
  ratio?: "square" | "video";
};

export default function ShowcaseSlideshow({
  imageModels,
  videoModels,
  intervalMs = 3800,
}: {
  intervalMs?: number;
  imageModels: ImageModelPricingDto[];
  videoModels: VideoModelPricingDto[];
}) {
  const toUrl = useCallback(
    (c: string, s: string) => modelCodeToShowCaseUrl(c, s),
    [],
  );

  const imageSlides: Slide[] = useMemo(
    () =>
      imageModels
        .filter((m) => m.hasShowCaseImage)
        .map((m) => ({
          key: m.code,
          title: m.name,
          type: "image",
          ratio: "square",
          src: toUrl(m.code, "images"),
        })),
    [imageModels, toUrl],
  );

  const videoSlides: Slide[] = useMemo(
    () =>
      videoModels
        .filter((m) => m.hasShowCaseVideo)
        .map((m) => ({
          key: m.code,
          title: m.name,
          type: "video",
          ratio: "video",
          src: toUrl(m.code, "videos"),
          poster: toUrl(m.code, "videos/posters"),
        })),
    [videoModels, toUrl],
  );

  return (
    <section id="showcase" className="py-16 bg-muted/30">
      <div className="mx-auto px-4 flex justify-center">
        <div className="w-full md:max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            نمونه هایی از مدل های بصری سپهر AI
          </h2>

          <div className="space-y-10">
            <Carousel slides={videoSlides} intervalMs={intervalMs} />
            <Carousel slides={imageSlides} intervalMs={intervalMs} />
          </div>
        </div>
      </div>
    </section>
  );
}

type Props = {
  slides: Slide[];
  intervalMs?: number;
  className?: string;
  transitionMs?: number;
};

const DEFAULT_TRANSITION_MS = 1300;

export function Carousel({
  slides,
  intervalMs = 3800,
  className = "",
  transitionMs = DEFAULT_TRANSITION_MS,
}: Props) {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const active = slides[index];

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Safe clearTimeout for both Node and browser
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const nextIndex = useMemo(
    () => (index + 1) % (slides.length || 1),
    [index, slides.length],
  );

  const goNext = useCallback(() => {
    if (!slides.length || isAnimating) return;
    setPrevIndex(index);
    setIndex((i) => (i + 1) % slides.length);
    setIsAnimating(true);
    // Remove the leaving slide after the transition
    window.setTimeout(() => {
      setPrevIndex(null);
      setIsAnimating(false);
    }, transitionMs + 40);
  }, [index, slides.length, isAnimating, transitionMs]);

  // Preload the next slide while current is showing
  useEffect(() => {
    if (!slides.length) return;

    const next = slides[nextIndex];
    if (!next) return;

    let videoEl: HTMLVideoElement | null = null;
    let imgEl: HTMLImageElement | null = null;

    if (next.type === "image") {
      imgEl = new Image();
      imgEl.src = next.src;
      // optional: prioritize display-locked decoding where supported
      imgEl.decoding = "async";
    } else {
      videoEl = document.createElement("video");
      videoEl.preload = "auto";
      videoEl.src = next.src;
      // Load metadata to kick off buffering; this is lightweight
      try {
        videoEl.load();
      } catch {
        /* ignore */
      }
      // Preload poster if present
      if (next.poster) {
        const posterImg = new Image();
        posterImg.src = next.poster;
      }
    }

    return () => {
      // let GC reclaim; no explicit cleanup needed
      videoEl = null;
      imgEl = null;
    };
  }, [nextIndex, slides]);

  // Schedule progression depending on slide type
  useEffect(() => {
    clearTimer();

    if (!active) return;

    if (active.type === "image") {
      timerRef.current = window.setTimeout(() => {
        goNext();
      }, intervalMs) as unknown as number;
    } else {
      // video: auto-advance on ended
      const v = videoRef.current;
      if (!v) return;

      const onEnded = () => {
        goNext();
      };
      const onError = () => {
        // Fallback: move on if video fails
        timerRef.current = window.setTimeout(
          () => {
            goNext();
          },
          Math.max(1200, Math.min(5000, intervalMs)),
        ) as unknown as number;
      };

      v.addEventListener("ended", onEnded);
      v.addEventListener("error", onError);

      // Try to autoplay; if it fails (policy), fall back to timed advance
      const tryPlay = async () => {
        try {
          await v.play();
        } catch {
          // Autoplay might be blocked if not muted; we set muted, but in case:
          v.muted = true;
          try {
            await v.play();
          } catch {
            onError();
          }
        }
      };
      // If metadata not ready, wait a tick to play
      if (v.readyState >= 2) {
        void tryPlay();
      } else {
        const onLoaded = () => {
          v.removeEventListener("loadeddata", onLoaded);
          void tryPlay();
        };
        v.addEventListener("loadeddata", onLoaded);
      }

      return () => {
        v.removeEventListener("ended", onEnded);
        v.removeEventListener("error", onError);
      };
    }

    return () => {
      clearTimer();
    };
  }, [active, intervalMs, goNext, clearTimer]);

  // Guard against empty slides
  if (!slides.length) {
    return null;
  }

  return (
    <div className={`rtl`}>
      <div
        className={`relative overflow-hidden rounded-2xl bg-card border border-border aspect-video ${className}`}
        aria-roledescription="carousel"
      >
        {/* Current Slide (entering) */}
        <AnimatedSlide
          key={`curr-${active.key}`}
          slide={active}
          state={prevIndex === null ? "idle" : "enter"}
          transitionMs={transitionMs}
          attachVideoRef={(el) => {
            if (el) videoRef.current = el;
          }}
        />

        {/* Previous Slide (leaving) */}
        {prevIndex !== null && slides[prevIndex] && (
          <AnimatedSlide
            key={`prev-${slides[prevIndex].key}`}
            slide={slides[prevIndex]}
            state="leave"
            transitionMs={transitionMs}
          />
        )}
      </div>
    </div>
  );
}

function AnimatedSlide({
  slide,
  state, // "idle" | "enter" | "leave"
  transitionMs,
  attachVideoRef,
}: {
  slide: Slide;
  state: "idle" | "enter" | "leave";
  transitionMs: number;
  attachVideoRef?: (el: HTMLVideoElement | null) => void;
}) {
  // We use a mount tick to enable CSS transitions from initial positions
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const base =
    "absolute inset-0 will-change-transform transition-transform ease-out";
  const dur = `duration-[${transitionMs}ms]`;

  // Right-to-left:
  // - entering slide: begins at translate-x-full, then 0
  // - leaving slide: begins at 0, then -translate-x-full
  const translateClass =
    state === "idle"
      ? "translate-x-0"
      : state === "enter"
        ? mounted
          ? "translate-x-0"
          : "translate-x-full"
        : // leave
          mounted
          ? "-translate-x-full"
          : "translate-x-0";

  const z =
    state === "enter" || state === "idle"
      ? "z-20"
      : state === "leave"
        ? "z-10"
        : "";

  return (
    <div className={`${base} ${dur} ${translateClass} ${z}`}>
      <div className="w-full">
        {slide.type === "image" ? (
          <img
            src={slide.src}
            alt={slide.title}
            className="w-full h-full object-cover bg-black select-none pointer-events-none"
            draggable={false}
            loading="eager"
            // decoding async can improve smoothness
            decoding="async"
          />
        ) : (
          <video
            ref={attachVideoRef}
            poster={slide.poster}
            // Autoplay requirements
            muted
            autoPlay
            playsInline
            // no loop; we advance on "ended"
            controls={false}
            className="w-full h-full object-cover bg-black"
            preload="auto"
          >
            <source src={slide.src} type="video/mp4"></source>
          </video>
        )}
      </div>

      {/* Subtle gradient edges to hide any tearing during transitions */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-background/50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-background/30 to-transparent" />
      {/* Caption (optional) */}
      <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-md bg-background/60 backdrop-blur border border-border">
        {slide.title}
      </div>
    </div>
  );
}
