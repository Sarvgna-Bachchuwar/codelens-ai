import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // max:1 prevents exhausting Neon free tier's 5-connection limit in serverless
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Cache in all environments — critical for Vercel serverless warm invocations
globalForPrisma.prisma = prisma
