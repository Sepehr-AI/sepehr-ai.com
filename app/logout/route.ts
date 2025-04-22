"use server";

import { handleServerLogout } from "./lib";

export async function GET() {
  return handleServerLogout();
}
