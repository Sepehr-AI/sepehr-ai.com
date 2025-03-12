"use client";

import dynamic from "next/dynamic";
import Loading from "./Loading";

export const LazyChat = dynamic(() => import("./Chat"), {
  loading: () => <Loading />,
});

export const LazyChatNoSSR = dynamic(() => import("./Chat"), {
  loading: () => <Loading />,
  ssr: false,
});
