import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getDemoUserId } from '@/lib/demo-user'

export async function GET() {
  const userId = await getDemoUserId()

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId } })) ??
    (await prisma.workspace.create({ data: { name: 'My Workspace', userId } }))

  return NextResponse.json(workspace)
}

export async function POST(req: Request) {
  const userId = await getDemoUserId()
  const { name } = (await req.json()) as { name: string }
  const workspace = await prisma.workspace.create({ data: { name, userId } })
  return NextResponse.json(workspace, { status: 201 })
}
