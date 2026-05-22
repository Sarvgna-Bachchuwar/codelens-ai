export type GithubRepoRef = { owner: string; repo: string }

export function parseGithubUrl(url: string): GithubRepoRef {
  const match = url
    .trim()
    .match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
  if (!match) throw new Error('Invalid GitHub URL')
  return { owner: match[1], repo: match[2] }
}
