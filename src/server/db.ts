import { PrismaClient } from "@prisma/client";

// Em desenvolvimento, o Next.js recarrega os arquivos a cada alteração.
// Sem este truque, cada recarga criaria uma nova conexão com o banco até
// esgotar o limite. Guardamos uma única instância no objeto global.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
