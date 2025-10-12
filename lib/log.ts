import type { ErrorType } from "@/prisma/client";
import type { JsonObject } from "@/prisma/client/runtime/library";

import prisma from "./prisma";

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

export const info = (context: string, msg: unknown): void => {
  if (process.env.NODE_ENV === "production") {
    storeIntoDB("INFO", context, msg);
  } else console.log(context, msg);
};
export const warn = (context: string, msg: unknown): void => {
  if (process.env.NODE_ENV === "production") {
    storeIntoDB("WARN", context, msg);
  } else console.warn(context, msg);
};
export const error = (context: string, msg: unknown): void => {
  if (process.env.NODE_ENV === "production") {
    storeIntoDB("ERROR", context, msg);
  } else console.error(context, msg);
};

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
