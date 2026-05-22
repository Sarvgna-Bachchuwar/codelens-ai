import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId: session.user.id } })) ??
    (await prisma.workspace.create({
      data: { name: 'My Workspace', userId: session.user.id },
    }))

  return NextResponse.json(workspace)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = (await req.json()) as { name: string }
  const workspace = await prisma.workspace.create({
    data: { name, userId: session.user.id },
  })

  return NextResponse.json(workspace, { status: 201 })
}
