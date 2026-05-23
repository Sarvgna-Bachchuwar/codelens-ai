import { prisma } from '@/lib/db/prisma'
import { getDemoUserId } from '@/lib/demo-user'
import { AddRepoForm } from '@/components/repo/add-repo-form'

export default async function AddRepoPage() {
  const userId = await getDemoUserId()

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId } })) ??
    (await prisma.workspace.create({ data: { name: 'My Workspace', userId } }))

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Repository</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a GitHub repository to analyze.
        </p>
      </div>
      <AddRepoForm workspaceId={workspace.id} />
    </div>
  )
}
