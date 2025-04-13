/* eslint-disable @typescript-eslint/no-explicit-any */

const msgToString = (msg: any): string => {
  if (typeof msg === "string" || msg instanceof String) return msg as string;
  try {
    return JSON.stringify(msg);
  } catch (error) {
    console.error("Failed to log:", { msg, error });
  }
  return msg;
};

// TODO: Store these in the database.
export const info = (context: string, _msg: any) => {
  const msg = msgToString(_msg);
  if (!msg) return;

  console.log("Log info:", { context, _msg });
};
export const warn = (context: string, _msg: any) => {
  const msg = msgToString(_msg);
  if (!msg) return;

  console.log("Log warn:", { context, _msg });
};
export const error = (context: string, _msg: any) => {
  const msg = msgToString(_msg);
  if (!msg) return;

  console.log("Log error:", { context, _msg });
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
