// NOTE: type-only import to avoid bundling Prisma on the client
export type DBJobStatus = import("@/prisma/client").JobStatus;

// UI status extends DB enum with client-only states
export type JobStatus = DBJobStatus | "IDLE" | "SUBMITTING" | "CANCELED";
