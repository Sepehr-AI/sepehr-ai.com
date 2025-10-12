"use client";

import dynamic from "next/dynamic";
import React, {
  type ComponentProps,
  type ComponentType,
  type FC,
  type JSX,
  Suspense,
} from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// A small inline fallback that preserves layout.
// You can adjust height/width or replace with a spinner.
const NoopFallback: FC = () => <div style={{ height: 0 }} />;

function motionLoader<K extends keyof JSX.IntrinsicElements>(tag: K) {
  const Component: ComponentType<{
    children?: JSX.Element | JSX.Element[] | string;
  }> = dynamic(
    () =>
      import("framer-motion").then((mod) => {
        // @ts-expect-error dynamic index access
        return mod.motion[tag];
      }),
    { ssr: false },
  );

  return Object.assign(
    (props: ComponentProps<typeof Component> & { [k: string]: any }) => (
      <Suspense fallback={<NoopFallback />}>
        <Component {...props} />
      </Suspense>
    ),
    { displayName: "MotionComponent" },
  );
}

export const MotionDiv = motionLoader("div");
export const MotionSpan = motionLoader("span");
