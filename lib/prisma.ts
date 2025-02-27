import { PrismaClient } from '@prisma/client';

declare global {
    // Prevent multiple instances of Prisma Client in development
    // by attaching it to the NodeJS global object.
    let prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
