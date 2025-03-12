"use client";

import Loading from "@/app/components/Loading";
import { PropsWithChildren, useEffect, useState } from "react";
import { listenOnEvent } from "@/lib/eventTransfer";

export default function Loadable({ children }: PropsWithChildren) {
  const [isLoadingState, setIsLoadingState] = useState(false);

  useEffect(() => {
    return listenOnEvent<boolean>(
      "SetLoadingState",
      (e: CustomEventInit<boolean>) => {
        if (typeof e.detail === "undefined" || e.detail === null) return;
        setIsLoadingState(e.detail as boolean);
      }
    );
  }, []);

  if (isLoadingState) return <Loading />;

  return children;
}
