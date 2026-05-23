import { prisma } from '@/lib/db/prisma'
import { getDemoUserId } from '@/lib/demo-user'
import { RepoList } from '@/components/dashboard/repo-list'

export default async function DashboardPage() {
  const userId = await getDemoUserId()

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId } })) ??
    (await prisma.workspace.create({ data: { name: 'My Workspace', userId } }))

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
