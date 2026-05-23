import { Octokit } from '@octokit/rest'
import { prisma } from '@/lib/db/prisma'
import { parseGithubUrl } from '@/lib/github/validate'
import { fetchRepoFiles } from './fetcher'
import { buildArchMap } from './arch-mapper'
import * as largeFile from './rules/large-file'
import * as missingTest from './rules/missing-test'
import * as hardcodedEnv from './rules/hardcoded-env'
import * as longMethod from './rules/long-method'
import * as todoComment from './rules/todo-comment'
import * as nPlusOne from './rules/n-plus-one'
import { generateFindingSummary, generateRecommendations } from '@/lib/ai/claude'
import type { FindingInput } from './types'

export async function runAnalysis(analysisRunId: string): Promise<void> {
  await prisma.analysisRun.update({
    where: { id: analysisRunId },
    data: { status: 'RUNNING' },
  })

  try {
    const run = await prisma.analysisRun.findUnique({
      where: { id: analysisRunId },
      include: { repository: { include: { workspace: true } } },
    })
    if (!run) throw new Error(`AnalysisRun ${analysisRunId} not found`)

    const { owner, repo } = parseGithubUrl(run.repository.url)
    const userId = run.repository.workspace.userId

    const account = await prisma.account.findFirst({
      where: { userId, provider: 'github' },
      select: { access_token: true },
    })

    const octokit = new Octokit({ auth: account?.access_token ?? undefined })
    const files = await fetchRepoFiles(octokit, owner, repo, run.repository.branch)
    const allPaths = files.map((f) => f.path)

    // Run all rules
    const findings: FindingInput[] = []
    for (const file of files) {
      findings.push(...largeFile.run(file))
      findings.push(...missingTest.run(file, allPaths))
      findings.push(...hardcodedEnv.run(file))
      findings.push(...longMethod.run(file))
      findings.push(...todoComment.run(file))
      findings.push(...nPlusOne.run(file))
    }

    // Build arch map
    const { nodes, edges } = buildArchMap(files)

    // Generate AI summaries for HIGH findings (in parallel, failures are silenced)
    const highFindings = findings.filter((f) => f.severity === 'HIGH')
    const summaryResults = await Promise.allSettled(
      highFindings.map((f) => generateFindingSummary(f)),
    )
    const summaryMap = new Map<FindingInput, string>()
    highFindings.forEach((f, i) => {
      const r = summaryResults[i]
      if (r.status === 'fulfilled') summaryMap.set(f, r.value)
    })

    // Save findings (with AI summaries for HIGH ones)
    if (findings.length > 0) {
      await prisma.finding.createMany({
        data: findings.map((f) => ({
          ...f,
          analysisRunId,
          aiSummary: summaryMap.get(f) ?? null,
        })),
      })
    }

    // Generate and save recommendations from HIGH findings
    try {
      const recommendations = await generateRecommendations(findings)
      if (recommendations.length > 0) {
        await prisma.recommendation.createMany({
          data: recommendations.map((r) => ({ ...r, analysisRunId })),
        })
        console.log(`✓ Generated ${recommendations.length} recommendations`)
      } else {
        console.log('No HIGH findings found for recommendations')
      }
    } catch (err) {
      console.error('❌ Recommendation generation failed:', err)
      // Don't fail the whole run if AI recommendations fail
    }

    // Save arch nodes and build label → id map
    const nodeIdMap = new Map<string, string>()
    for (const node of nodes) {
      const created = await prisma.archNode.create({
        data: { ...node, analysisRunId },
      })
      nodeIdMap.set(node.label, created.id)
    }

    // Save arch edges
    const edgeData = edges
      .map((e) => ({
        analysisRunId,
        sourceId: nodeIdMap.get(e.sourceLabel) ?? '',
        targetId: nodeIdMap.get(e.targetLabel) ?? '',
        label: e.label,
      }))
      .filter((e) => e.sourceId && e.targetId)

    if (edgeData.length > 0) {
      await prisma.archEdge.createMany({ data: edgeData })
    }

    const highRiskCount = findings.filter((f) => f.severity === 'HIGH').length
    const healthScore = Math.max(0, 100 - Math.round((highRiskCount / Math.max(files.length, 1)) * 100))

    // coverageScore = % of source files that have a matching test file
    const SOURCE_EXTS = new Set(['.rb', '.js', '.ts', '.jsx', '.tsx'])
    const isTestFile = (p: string) =>
      /\.(test|spec)\.[jt]sx?$/.test(p) || p.includes('spec/') || p.includes('__tests__/') || p.endsWith('_spec.rb')
    const sourceFiles = files.filter((f) => {
      const ext = f.path.slice(f.path.lastIndexOf('.'))
      return SOURCE_EXTS.has(ext) && !isTestFile(f.path)
    })
    const missingTestCount = findings.filter((f) => f.category === 'MISSING_TEST').length
    const coveredCount = sourceFiles.length - missingTestCount
    const coverageScore = sourceFiles.length > 0
      ? Math.round((coveredCount / sourceFiles.length) * 100)
      : 100

    await prisma.analysisRun.update({
      where: { id: analysisRunId },
      data: {
        status: 'COMPLETED',
        totalFiles: files.length,
        totalFindings: findings.length,
        highRiskCount,
        coverageScore,
        healthScore,
        completedAt: new Date(),
      },
    })
  } catch (err) {
    await prisma.analysisRun.update({
      where: { id: analysisRunId },
      data: { status: 'FAILED' },
    })
    throw err
  }
}
