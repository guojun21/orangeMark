export interface BuildWorkspaceFolderListOptions {
  activePath: string
  storedPaths: readonly string[]
  legacyPaths?: readonly string[]
  isSamePath: (left: string, right: string) => boolean
  maxItems?: number
}

/**
 * Build the persistent project switcher list.
 *
 * Existing projects keep their position when the user switches between them.
 * On first use, the old recent-folders list is migrated so an upgrade does not
 * start with an empty project switcher.
 */
export const buildWorkspaceFolderList = ({
  activePath,
  storedPaths,
  legacyPaths = [],
  isSamePath,
  maxItems = 50
}: BuildWorkspaceFolderListOptions): string[] => {
  const source = storedPaths.length > 0 ? storedPaths : legacyPaths
  const result: string[] = []

  for (const pathname of source) {
    if (
      typeof pathname === 'string' &&
      pathname.length > 0 &&
      !result.some((existingPath) => isSamePath(existingPath, pathname))
    ) {
      result.push(pathname)
    }
  }

  if (activePath && !result.some((existingPath) => isSamePath(existingPath, activePath))) {
    result.push(activePath)
  }

  return result.slice(0, Math.max(1, maxItems))
}
