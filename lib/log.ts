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

  console.log("Log info:", { context, msg });
};
export const warn = (context: string, _msg: any) => {
  const msg = msgToString(_msg);
  if (!msg) return;

  console.log("Log warn:", { context, msg });
};
export const error = (context: string, _msg: any) => {
  const msg = msgToString(_msg);
  if (!msg) return;

  console.log("Log error:", { context, msg });
};
