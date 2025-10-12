/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "../prisma/client";

declare global {
  // Prevent multiple instances of Prisma Client in development
  // by attaching it to the NodeJS global object.
  let prisma: PrismaClient;
}

const prisma: PrismaClient = (global as any).prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") (global as any).prisma = prisma;

await prisma.$executeRaw`SET TIME ZONE 'Asia/Tehran';`;

export default prisma;
