import { describe, expect, it } from 'vitest'
import { buildWorkspaceFolderList } from '@shared/utils/workspaceFolders'

const isSamePath = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase()

describe('multi-project workspace folder list', () => {
  it('preserves project order while switching the active project', () => {
    expect(
      buildWorkspaceFolderList({
        activePath: '/work/two',
        storedPaths: ['/work/one', '/work/two', '/work/three'],
        isSamePath
      })
    ).toEqual(['/work/one', '/work/two', '/work/three'])
  })

  it('migrates legacy recent projects and appends a new project', () => {
    expect(
      buildWorkspaceFolderList({
        activePath: '/work/new',
        storedPaths: [],
        legacyPaths: ['/work/one', '/work/two'],
        isSamePath
      })
    ).toEqual(['/work/one', '/work/two', '/work/new'])
  })

  it('deduplicates paths using the platform path comparator', () => {
    expect(
      buildWorkspaceFolderList({
        activePath: '/WORK/ONE',
        storedPaths: ['/work/one', '/work/two', '/work/two'],
        isSamePath
      })
    ).toEqual(['/work/one', '/work/two'])
  })
})
