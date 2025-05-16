/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import net from "net";
import path from "path";
import type { z } from "zod";
import fs from "fs/promises";
import { error } from "@/lib/log";
import prisma from "@/lib/prisma";
import { spawn } from "child_process";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import getExchangeRate from "@/lib/exchange";
import { roundWebPlan } from "@/lib/cost";
import type { MiddlewareUserData } from "@/middleware";
import {
  sepehrFetch,
  chargeApiResSchema,
  chargeApiPayloadSchema,
} from "@/sepehr-ai-ipg/src/lib";

const PROJECT_ROOT = process.cwd();
const SEPEHR_AI_IPG_ADDR: string =
  process.env.SEPEHR_AI_IPG_ADDR || "localhost:4040";

// Helper: ensure directory exists recursively
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    error("ErrorEnsuringPidDirectoryForPayment", { dirPath, err });
    throw err;
  }
}

// Helper: check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper: kill process if PID file exists
async function killExistingTunnel(pidFilePath: string): Promise<void> {
  if (await fileExists(pidFilePath)) {
    try {
      const pidStr = await fs.readFile(pidFilePath, "utf-8");
      const pid = parseInt(pidStr, 10);
      if (!isNaN(pid)) {
        try {
          process.kill(pid);
          if (process.env.NODE_ENV === "development") {
            console.log(`Successfully killed process ${pid}`);
          }
        } catch (e: any) {
          // Process might already be dead
          error("FailedToKillProcessForPayment", { error: e, pid });
        }
      }
    } catch (e) {
      error("FailedToReadPidFileForPayment", { error: e });
    }
  }
}

// Helper: wait for a socket to be available (e.g., localhost:4040)
async function waitForSocket(
  host: string,
  port: number,
  timeoutMs = 10_000,
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = net.connect({ host, port }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - startTime > timeoutMs) {
          reject(
            new Error(
              `Timeout: Socket ${host}:${port} did not become available within ${timeoutMs}ms`,
            ),
          );
        } else {
          // try again after a delay
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

// The main function to handle tunnel restart within onFetchFailure:
async function handleTunnelRestart(): Promise<void> {
  // Define file and directory paths relative to the current file location.
  const baseDir = path.join(PROJECT_ROOT, "sepehr-ai-ipg");
  const tmpDir = path.join(baseDir, "tmp");
  const scriptsDir = path.join(baseDir, "scripts");
  const pidFilePath = path.join(tmpDir, "autossh_tunnel_pid.txt");
  const autosshScriptPath = path.join(scriptsDir, "autossh-daemon.sh");

  // Ensure the temporary directory exists.
  await ensureDirectory(tmpDir);

  // Kill the existing tunnel process if the PID file exists.
  await killExistingTunnel(pidFilePath);

  // Spawn the autossh daemon.
  const child = spawn(autosshScriptPath, {
    detached: true, // So that the child runs independently.
    stdio: "ignore",
  });

  // Detach the child so it can continue running.
  child.unref();

  // Wait for the tunnel port (4040) to be open.
  try {
    await waitForSocket("localhost", 4040, 30000);
    if (process.env.NODE_ENV === "development") console.log("Tunnel is up.");
  } catch (e) {
    error("TunnelDidNotStartInTimeForPayment", { error: e });
    throw e;
  }

  // Write the new process PID into the PID file.
  try {
    if (child.pid) {
      const pidStr = child.pid.toString();
      await fs.writeFile(pidFilePath, pidStr, { mode: 0o600 });
    }
  } catch (e) {
    error("FailedToWritePidToFileForPayment", { error: e });
    throw e;
  }
}

// Usage within onFetchFailure callback:
async function onFetchFailure() {
  try {
    await handleTunnelRestart();
  } catch (e) {
    error("FailedToStartAutosshTunnelForPayment", { error: e });
  }
}

export async function setupPaymentGate({
  user,
  planId,
}: {
  planId: number;
  user: MiddlewareUserData;
}): Promise<void> {
  const exchangeRate = await getExchangeRate();

  let price: number;
  let usdPrice: number;
  let usdCredits: number;
  try {
    const webPlan = await prisma.webPlan.findUnique({
      where: { id: planId },
      select: { usdPrice: true, usdCredits: true },
    });
    if (!webPlan) throw new Error("PlanNotFound");

    usdPrice = webPlan.usdPrice;
    usdCredits = webPlan.usdCredits;
    price = roundWebPlan(usdPrice * exchangeRate);
  } catch (e) {
    error("DatabaseOrExchangeErrorForPayment:", {
      user,
      planId,
      error: e,
      exchangeRate,
    });
    return redirect("/dashboard/payment");
  }

  if (process.env.NODE_ENV === "development") price = 10_000;

  const transaction = await prisma.transaction.create({
    data: {
      usdPrice,
      usdCredits,
      exchangeRate,
      amount: price,
      user: { connect: { id: user.id } },
    },
  });

  const invoiceId = transaction.id.toString();
  const paymentPayload: z.infer<typeof chargeApiPayloadSchema> = {
    invoiceId,
    amount: price,
    payload: `پلن ${planId} برای کاربر ${user.id}`,
  };

  let data: any = undefined;
  // Redirect back to the home page on failure.
  let redirectUrl: string = "/dashboard/payment";
  try {
    const res = await sepehrFetch(
      (obj: any, msg: string) => error(msg, obj),
      `http://${SEPEHR_AI_IPG_ADDR}/charge`,
      {
        onFetchFailure,
        body: paymentPayload,
        schema: chargeApiResSchema,
      },
    );
    data = res[0];
    if (res[2]) throw new Error(res[2].error);

    redirectUrl = data.paymentURL;
  } catch (e) {
    error("UnableToConnectToSepehrAiIpgServerForPayment", { error: e, data });
  }

  return redirect(redirectUrl);
}

export async function chargeAccountAction(formData: FormData): Promise<void> {
  const headersList = await headers();
  const planId = Number(formData.get("planId"));
  const user: MiddlewareUserData = {
    id: Number(headersList.get("userId")),
    email: headersList.get("userEmail") as string,
    mobile: headersList.get("usermobile") as string,
  };

  if (isNaN(planId) || isNaN(user.id) || !user.mobile) {
    console.error("Unexpected input:", { user });
    return redirect("/dashboard/payment");
  }

  return setupPaymentGate({ planId, user });
}
