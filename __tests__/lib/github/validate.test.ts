import { describe, it, expect } from 'vitest'
import { parseGithubUrl } from '@/lib/github/validate'

describe('parseGithubUrl', () => {
  it('parses a valid github.com URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('strips .git suffix from URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react.git')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('strips trailing slash from URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react/')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('throws for a non-github URL', () => {
    expect(() => parseGithubUrl('https://gitlab.com/user/repo')).toThrow('Invalid GitHub URL')
  })

  it('throws for a URL with only an owner (no repo)', () => {
    expect(() => parseGithubUrl('https://github.com/facebook')).toThrow('Invalid GitHub URL')
  })

  it('throws for an empty string', () => {
    expect(() => parseGithubUrl('')).toThrow('Invalid GitHub URL')
  })

  it('throws for a plain string that is not a URL', () => {
    expect(() => parseGithubUrl('facebook/react')).toThrow('Invalid GitHub URL')
  })
})
