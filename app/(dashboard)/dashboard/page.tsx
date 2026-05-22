import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'
import { RepoList } from '@/components/dashboard/repo-list'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId: session.user.id } })) ??
    (await prisma.workspace.create({
      data: { name: 'My Workspace', userId: session.user.id },
    }))

  const repos = await prisma.repository.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <RepoList
      workspaceName={workspace.name}
      repos={repos.map((r: typeof repos[number]) => ({
        id: r.id,
        name: r.name,
        url: r.url,
        branch: r.branch,
      }))}
    />
  )
}
