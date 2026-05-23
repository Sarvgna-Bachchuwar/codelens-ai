import { prisma } from '@/lib/db/prisma'

const DEMO_EMAIL = 'demo@codelens.local'

export async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: 'Demo User' },
  })
  return user.id
}
