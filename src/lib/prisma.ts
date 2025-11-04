import type { PrismaClient } from "@/generated/prisma/client";
import { PrismaClient as PrismaClientConstructor } from "@/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prismaGlobal ?? new PrismaClientConstructor({
  log: ["warn", "error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
