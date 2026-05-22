import path from 'path'
import { Octokit } from '@octokit/rest'
import type { FileContent } from './types'

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'tmp', 'log', 'vendor', 'dist', 'build', 'coverage',
])

const INCLUDED_EXTS = new Set([
  '.rb', '.js', '.ts', '.tsx', '.jsx', '.json', '.yml', '.yaml', '.sql',
])

const MAX_FILES = 200
const BATCH_SIZE = 10

function isIncluded(filePath: string): boolean {
  const parts = filePath.split('/')
  if (parts.some((p) => EXCLUDED_DIRS.has(p))) return false
  return INCLUDED_EXTS.has(path.extname(filePath))
}

async function resolveRef(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  try {
    // Verify the branch exists by checking the repo ref
    await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` })
    return branch
  } catch {
    // Branch not found — fall back to the repo's default branch
    const { data } = await octokit.repos.get({ owner, repo })
    return data.default_branch
  }
}

export async function fetchRepoFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
): Promise<FileContent[]> {
  const ref = await resolveRef(octokit, owner, repo, branch)

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: '1',
  })

  const blobs = (tree.tree ?? [])
    .filter((item) => item.type === 'blob' && item.path && isIncluded(item.path))
    .slice(0, MAX_FILES)

  // Fetch file contents in small batches to avoid simultaneous request overload
  const results: FileContent[] = []
  for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
    const batch = blobs.slice(i, i + BATCH_SIZE)
    const fetched = await Promise.all(
      batch.map(async (blob) => {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: blob.path!,
            ref,              // always use the resolved ref, not the stored branch
          })
          if ('content' in data && typeof data.content === 'string') {
            const content = Buffer.from(data.content, 'base64').toString('utf-8')
            return { path: blob.path!, content }
          }
        } catch {
          // Skip files that can't be fetched (too large, permissions, etc.)
        }
        return null
      }),
    )
    results.push(...fetched.filter((f): f is FileContent => f !== null))
  }

  return results
}
