import { describe, it, expect } from 'vitest'
import { buildArchMap } from '@/lib/analysis/arch-mapper'

const f = (path: string, content = '') => ({ path, content })

describe('buildArchMap', () => {
  it('detects a Rails controller', () => {
    const { nodes } = buildArchMap([f('app/controllers/users_controller.rb')])
    expect(nodes).toContainEqual(
      expect.objectContaining({ type: 'CONTROLLER', filePath: 'app/controllers/users_controller.rb' }),
    )
  })

  it('detects a TypeScript controller', () => {
    const { nodes } = buildArchMap([f('src/controllers/UserController.ts')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'CONTROLLER' }))
  })

  it('detects a service file', () => {
    const { nodes } = buildArchMap([f('app/services/payment_service.rb')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'SERVICE' }))
  })

  it('detects a TypeScript service', () => {
    const { nodes } = buildArchMap([f('src/services/AnalysisService.ts')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'SERVICE' }))
  })

  it('detects a Rails model', () => {
    const { nodes } = buildArchMap([f('app/models/user.rb')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'MODEL' }))
  })

  it('detects Prisma schema as a DATABASE node', () => {
    const { nodes } = buildArchMap([f('prisma/schema.prisma', 'model User {}')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'DATABASE' }))
  })

  it('detects a React component (.tsx with JSX content)', () => {
    const { nodes } = buildArchMap([f('src/components/Button.tsx', 'export function Button() { return <div /> }')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'COMPONENT' }))
  })

  it('detects a Next.js API route as ROUTE', () => {
    const { nodes } = buildArchMap([f('app/api/users/route.ts', 'export async function GET() {}')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'ROUTE' }))
  })

  it('returns an edge from controller to model when model name is referenced', () => {
    const files = [
      f('app/controllers/users_controller.rb', 'User.find(1)'),
      f('app/models/user.rb', 'class User'),
    ]
    const { edges } = buildArchMap(files)
    expect(edges.length).toBeGreaterThan(0)
  })

  it('returns empty arrays for files with no recognisable architecture role', () => {
    const { nodes, edges } = buildArchMap([f('config/database.yml', 'adapter: postgresql')])
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('detects a plain .js file as SERVICE', () => {
    const { nodes } = buildArchMap([f('src/app.js', 'const express = require("express")')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'SERVICE' }))
  })

  it('detects a router file as ROUTE', () => {
    const { nodes } = buildArchMap([f('src/routes.js', 'router.get("/")')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'ROUTE' }))
  })

  it('detects a file with controller in its name as CONTROLLER', () => {
    const { nodes } = buildArchMap([f('src/userController.js', 'module.exports = {}')])
    expect(nodes).toContainEqual(expect.objectContaining({ type: 'CONTROLLER' }))
  })

  it('skips test files', () => {
    const { nodes } = buildArchMap([f('src/app.test.js', 'describe("app")')])
    expect(nodes).toHaveLength(0)
  })
})
