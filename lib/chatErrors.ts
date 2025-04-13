/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";

export const balanceNotEnoughStatus: number = 402;
export const balanceNotEnoughMsg = "Account balance is not enough!";
export interface BalanceNotEnoughBodyType {
  error: typeof balanceNotEnoughMsg;
}
export const genBalanceNotEnoughRes = (otherOptions?: ResponseInit) =>
  NextResponse.json(
    { error: balanceNotEnoughMsg } as BalanceNotEnoughBodyType,
    {
      ...otherOptions,
      status: balanceNotEnoughStatus,
    },
  );

export const unauthorizedStatus: number = 403;
export enum UnauthorizedReason {
  UNAUTH = "Unauthorized!",
  USER_NOT_FOUND = "User doesn't exist!",
  JWT_NOT_VALID = "JWT token is invalid!",
  COOKIE_NOT_SET = "The authentication cookie is not set!",
}
export interface UnauthorizedBodyType {
  error: UnauthorizedReason;
}
export const genUnauthorizedRes = (
  error: UnauthorizedReason,
  otherOptions?: ResponseInit,
) =>
  NextResponse.json({ error } as UnauthorizedBodyType, {
    ...otherOptions,
    status: unauthorizedStatus,
  });

export const modelNotFoundStatus: number = 404;
export const modelNotFoundMsg = "Model not found!";
export interface ModelNotFoundBodyType {
  error: typeof modelNotFoundMsg;
}
export const genModelNotFoundRes = (otherOptions?: ResponseInit) =>
  NextResponse.json({ error: modelNotFoundMsg } as ModelNotFoundBodyType, {
    ...otherOptions,
    status: modelNotFoundStatus,
  });

export const unexpectedErrorMsg = "Unexpected error!";
export const unexpectedErrorStatus: number = 500;
export interface UnexpectedErrorBodyType {
  details: any;
  error: typeof unexpectedErrorMsg;
}
export const genUnexpectedErrorRes = (
  error: any,
  otherOptions?: ResponseInit,
) =>
  NextResponse.json({ error } as UnexpectedErrorBodyType, {
    ...otherOptions,
    status: unexpectedErrorStatus,
  });

export const invalidJsonBodyStatus: number = 404;
export const invalidJsonBodyMsg = "Invalid Json body!";
export interface InvalidJsonBodyType {
  error: typeof invalidJsonBodyMsg;
}
export const geninvalidJsonBodyRes = (otherOptions?: ResponseInit) =>
  NextResponse.json({ error: invalidJsonBodyMsg } as InvalidJsonBodyType, {
    ...otherOptions,
    status: invalidJsonBodyStatus,
  });

export const invalidMessagesErrorStatus: number = 400;
export const invalidMessagesErrorMsg = "Invalid messages!";
export interface InvalidMessagesErrorBodyType {
  details: string;
  error: typeof invalidMessagesErrorMsg;
}
export const genInvalidMessagesErrorRes = (
  details: string,
  otherOptions?: ResponseInit,
) =>
  NextResponse.json(
    { error: invalidMessagesErrorMsg, details } as InvalidMessagesErrorBodyType,
    {
      ...otherOptions,
      status: invalidMessagesErrorStatus,
    },
  );

export const maxContextReachedErrorStatus: number = 400;
export const maxContextReachedErrorMsg =
  "Maximum context tokens reached for the model!";
export interface MaxContextReachedErrorBodyType {
  error: typeof maxContextReachedErrorMsg;
}
export const genMaxContextReachedErrorRes = (otherOptions?: ResponseInit) =>
  NextResponse.json(
    {
      error: maxContextReachedErrorMsg,
    } as MaxContextReachedErrorBodyType,
    {
      ...otherOptions,
      status: maxContextReachedErrorStatus,
    },
  );
