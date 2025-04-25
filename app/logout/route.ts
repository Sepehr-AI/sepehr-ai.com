"use server";

import { handleServerLogout } from "./lib";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return handleServerLogout(req);
}
