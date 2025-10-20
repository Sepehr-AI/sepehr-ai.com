import type { ErrorType } from "@/prisma/client";
import type { JsonObject } from "@/prisma/client/runtime/library";

import { sendErrorNotice } from "./emailNotitifer";
import prisma from "./prisma";

/**
 * Log level handling
 */
type LogLevel = "ERROR" | "WARN" | "INFO";
const PRIORITY: Record<LogLevel, number> = { INFO: 1, WARN: 2, ERROR: 3 };

const normalizeLevel = (v?: string | null): LogLevel | undefined => {
  if (!v) return undefined;
  const s = v.toUpperCase().trim();
  if (s === "ERROR" || s === "WARN" || s === "INFO") return s;
  return undefined;
};

const defaultLevelForEnv = (nodeEnv?: string): LogLevel =>
  nodeEnv === "production" ? "ERROR" : "INFO";

const CURRENT_LOG_LEVEL: LogLevel =
  normalizeLevel(process.env.LOG_LEVEL) ??
  defaultLevelForEnv(process.env.NODE_ENV);

const shouldLog = (messageLevel: LogLevel): boolean =>
  PRIORITY[messageLevel] >= PRIORITY[CURRENT_LOG_LEVEL];

/* -- existing DB store kept as-is -- */
const storeIntoDB = (type: ErrorType, context: string, msg: unknown) =>
  prisma.error
    .create({
      data: {
        type,
        context,
        data: msg as JsonObject,
      },
    })
    .catch((e) =>
      console.error("Failed to create error for logging into the database.", {
        error: e,
      }),
    );

/* -- exported logging functions now respect CURRENT_LOG_LEVEL -- */
export const info = (context: string, msg: unknown): void => {
  if (!shouldLog("INFO")) return;

  if (process.env.NODE_ENV === "production") {
    storeIntoDB("INFO", context, msg);
  } else {
    console.log(context, msg);
  }
};

export const warn = (context: string, msg: unknown): void => {
  if (!shouldLog("WARN")) return;

  if (process.env.NODE_ENV === "production") {
    storeIntoDB("WARN", context, msg);
  } else {
    console.warn(context, msg);
  }
};

export const error = (context: string, msg: unknown): void => {
  if (!shouldLog("ERROR")) return;

  if (process.env.NODE_ENV === "production") {
    // keep DB logging
    storeIntoDB("ERROR", context, msg);

    // call the external email sender (fire-and-forget)
    // we intentionally don't await here; catch errors and log them.
    sendErrorNotice(context, msg).catch((err) => {
      console.error("Failed to send alert email:", err);
    });
  } else {
    console.error(context, msg);
  }
};

/* -- pass-through helpers unchanged but use the above error() which will respect levels -- */
export const errorOnThrow = async <Type>(
  context: string,
  handler: () => Promise<Type> | Type,
) => {
  let ret: Type | undefined = undefined;
  try {
    ret = await handler();
  } catch (e) {
    error(context, { error: e });
    throw new Error("Internal Server Error!");
  }

  return ret;
};

export const tryOrErr = async <T extends Error>(
  f: () => Promise<unknown>,
  ErrorConstructor: new (message?: string, options?: { cause?: unknown }) => T,
) => {
  try {
    await f();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (orig: any) {
    throw new ErrorConstructor(
      ((orig as Error) || { message: undefined }).message,
      { cause: orig },
    );
  }
};
