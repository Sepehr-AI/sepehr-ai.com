import "dotenv/config";
import path from "node:path";
import type { PrismaConfig } from "prisma";

export default {
    schema: path.join("prisma", "schema.prisma"),
    typedSql: { path: path.join("prisma", "sql") },
    migrations: {
        seed: "tsx prisma/seed.ts",
        path: path.join("prisma", "migrations"),
    },
} satisfies PrismaConfig;
