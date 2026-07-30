<template>
  <div class="tree-view">
    <div class="title explorer-title">
      <span>{{ explorerTitle }}</span>
    </div>

    <!-- Persistent multi-project switcher -->
    <div class="workspace-projects">
      <div class="workspace-projects-header">
        <span>{{ projectsTitle }}</span>
        <button
          type="button"
          :title="addProjectTitle"
          :aria-label="addProjectTitle"
          @click.stop="openFolder"
        >
          <el-icon :size="15">
            <Plus />
          </el-icon>
        </button>
      </div>
      <div
        v-if="workspaceProjects.length"
        class="workspace-projects-list"
      >
        <button
          v-for="pathname of workspaceProjects"
          :key="pathname"
          type="button"
          :class="{ active: isActiveProject(pathname) }"
          :title="pathname"
          @click="openWorkspaceProject(pathname)"
        >
          <el-icon :size="15">
            <FolderOpened v-if="isActiveProject(pathname)" />
            <FolderIcon v-else />
          </el-icon>
          <span class="text-overflow">{{ projectName(pathname) }}</span>
        </button>
      </div>
    </div>

    <!-- Opened tabs -->
    <div
      v-if="openedFilesInSidebar"
      class="opened-files"
    >
      <div class="title">
        <el-icon
          class="icon-arrow"
          :class="{ fold: !showOpenedFiles }"
          :size="12"
          @click.stop="toggleOpenedFiles()"
        >
          <ArrowRight />
        </el-icon>
        <span
          class="default-cursor text-overflow"
          @click.stop="toggleOpenedFiles()"
        >{{
          t('sideBar.tree.openedFiles')
        }}</span>
        <a
          href="javascript:;"
          :title="t('sideBar.tree.saveAll')"
          @click.stop="saveAll(false)"
        >
          <svg
            class="icon"
            aria-hidden="true"
          >
            <use xlink:href="#icon-save-all" />
          </svg>
        </a>
        <a
          href="javascript:;"
          :title="t('sideBar.tree.closeAll')"
          @click.stop="saveAll(true)"
        >
          <svg
            class="icon"
            aria-hidden="true"
          >
            <use xlink:href="#icon-close-all" />
          </svg>
        </a>
      </div>
      <div
        v-show="showOpenedFiles"
        class="opened-files-list"
      >
        <transition-group name="list">
          <opened-file
            v-for="tab of tabs"
            :key="tab.id"
            :file="tab"
          />
        </transition-group>
      </div>
    </div>

    <!-- Project tree view -->
    <div
      v-if="projectTree"
      class="project-tree"
    >
      <div
        class="title"
        @contextmenu.prevent="handleRootContextMenu"
      >
        <el-icon
          class="icon-arrow"
          :class="{ fold: !showDirectories }"
          :size="12"
          @click.stop="toggleDirectories()"
        >
          <ArrowRight />
        </el-icon>
        <span
          class="default-cursor text-overflow"
          @click.stop="toggleDirectories()"
        >{{
          projectTree.name
        }}</span>
        <div class="project-actions">
          <button
            type="button"
            :title="actionTitles.newFile"
            @click.stop="startCreate('file')"
          >
            <el-icon :size="15">
              <DocumentAdd />
            </el-icon>
          </button>
          <button
            type="button"
            :title="actionTitles.newFolder"
            @click.stop="startCreate('directory')"
          >
            <el-icon :size="15">
              <FolderAdd />
            </el-icon>
          </button>
          <button
            type="button"
            :title="actionTitles.refresh"
            @click.stop="refreshProject"
          >
            <el-icon :size="15">
              <Refresh />
            </el-icon>
          </button>
          <button
            type="button"
            :title="actionTitles.collapseAll"
            @click.stop="collapseAll"
          >
            <el-icon :size="15">
              <Fold />
            </el-icon>
          </button>
        </div>
      </div>
      <div
        v-show="showDirectories"
        class="tree-wrapper"
      >
        <folder
          v-for="folder of projectTree.folders"
          :key="folder.id"
          :folder="folder"
          :depth="depth"
        />
        <input
          v-show="createCacheDirname === projectTree.pathname"
          ref="input"
          v-model="createName"
          placeholder="Enter .md file name"
          type="text"
          class="new-input"
          :style="{ 'margin-left': `${depth * 5 + 15}px` }"
          @keypress.enter="handleInputEnter"
        >
        <file
          v-for="file of projectTree.files"
          :key="file.id"
          :file="file"
          :depth="depth"
        />
        <div
          v-if="
            projectTree.files.length === 0 &&
              projectTree.folders.length === 0 &&
              createCacheDirname !== projectTree.pathname
          "
          class="empty-project"
        >
          <span>{{ t('sideBar.tree.emptyProject') }}</span>
          <div class="centered-group">
            <button
              class="button-primary"
              @click.stop="createFile"
            >
              {{ t('sideBar.tree.createFile') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="open-project"
    >
      <div class="centered-group">
        <el-button
          text
          bg
          type="primary"
          @click="openFolder"
        >
          {{ t('sideBar.tree.openFolder') }}
        </el-button>
      </div>
      <div
        v-if="recentlyOpenedFolders.length"
        class="recent-projects"
      >
        <div class="recent-projects-title">
          {{ recentProjectsTitle }}
        </div>
        <button
          v-for="pathname of recentlyOpenedFolders"
          :key="pathname"
          type="button"
          :title="pathname"
          @click="openRecentProject(pathname)"
        >
          <el-icon :size="15">
            <FolderOpened />
          </el-icon>
          <span class="text-overflow">{{ projectName(pathname) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/store/project'
import { useEditorStore } from '@/store/editor'
import { usePreferencesStore } from '@/store/preferences'
import Folder from './treeFolder.vue'
import File from './treeFile.vue'
import OpenedFile from './treeOpenedTab.vue'
import bus from '../../bus'
import { showContextMenu } from '../../contextMenu/sideBar'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  DocumentAdd,
  FolderAdd,
  FolderOpened,
  Folder as FolderIcon,
  Plus,
  Refresh,
  Fold
} from '@element-plus/icons-vue'
import { buildWorkspaceFolderList } from '@shared/utils/workspaceFolders'
import type { TreeNode, TabDescriptor } from './types'

const { t } = useI18n()

const props = defineProps<{
  // The project store seeds `projectTree` as `null` until a folder is
  // opened; the template renders the "open project" empty-state behind
  // `v-if="projectTree"`. Type the prop nullable to match runtime + the
  // template guard.
  projectTree: TreeNode | null
  openedFiles?: TabDescriptor[]
  tabs?: TabDescriptor[]
}>()

const depth = 0
// Persist the section collapse state (#2421). The tree is rendered under a
// v-if and is destroyed when the sidebar collapses to its icon strip, so local
// refs reset to expanded on re-open. Back them with localStorage (like the
// sidebar width) so the state survives a re-mount and app restart.
const SHOW_DIRECTORIES_KEY = 'side-bar-show-directories'
const SHOW_OPENED_FILES_KEY = 'side-bar-show-opened-files'
const readSectionExpanded = (key: string): boolean => localStorage.getItem(key) !== 'false'
const showDirectories = ref(readSectionExpanded(SHOW_DIRECTORIES_KEY))
const showOpenedFiles = ref(readSectionExpanded(SHOW_OPENED_FILES_KEY))
const createName = ref('')
const input = ref<HTMLInputElement | null>(null)

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const preferencesStore = usePreferencesStore()

// Computed properties
const { createCache } = storeToRefs(projectStore)
const { clipboard } = storeToRefs(projectStore)
const { openedFilesInSidebar, recentlyOpenedFolders, workspaceFolders, language } =
  storeToRefs(preferencesStore)

const isChinese = computed(() => language.value.startsWith('zh'))
const explorerTitle = computed(() => (isChinese.value ? '资源管理器' : 'EXPLORER'))
const recentProjectsTitle = computed(() => (isChinese.value ? '最近项目' : 'RECENT PROJECTS'))
const projectsTitle = computed(() => (isChinese.value ? '项目' : 'PROJECTS'))
const addProjectTitle = computed(() => (isChinese.value ? '添加项目' : 'Add project'))
const workspaceProjects = computed(() =>
  buildWorkspaceFolderList({
    activePath: props.projectTree?.pathname ?? '',
    storedPaths: workspaceFolders.value,
    legacyPaths: recentlyOpenedFolders.value,
    isSamePath: window.fileUtils.isSamePathSync
  })
)
const actionTitles = computed(() =>
  isChinese.value
    ? { newFile: '新建文件', newFolder: '新建文件夹', refresh: '刷新', collapseAll: '全部折叠' }
    : {
        newFile: 'New File',
        newFolder: 'New Folder',
        refresh: 'Refresh',
        collapseAll: 'Collapse All'
      }
)

// The createCache state is `{ dirname, type }` while an input is shown, and
// `{}` otherwise. Expose a typed accessor for the template so we don't have
// to thread `as any` through every comparison.
const createCacheDirname = computed<string | undefined>(() => {
  const cache = createCache.value as { dirname?: string }
  return cache.dirname
})

// Methods
const openFolder = (): void => {
  projectStore.ASK_FOR_OPEN_PROJECT()
}

const openRecentProject = (pathname: string): void => {
  projectStore.ASK_FOR_OPEN_PROJECT_PATH(pathname)
}

const openWorkspaceProject = (pathname: string): void => {
  if (!isActiveProject(pathname)) {
    projectStore.ASK_FOR_OPEN_PROJECT_PATH(pathname)
  }
}

const isActiveProject = (pathname: string): boolean => {
  const activePath = props.projectTree?.pathname
  return !!activePath && window.fileUtils.isSamePathSync(activePath, pathname)
}

const projectName = (pathname: string): string => {
  return window.path.basename(pathname) || pathname
}

const saveAll = (isClose: boolean): void => {
  editorStore.ASK_FOR_SAVE_ALL(isClose)
}

const startCreate = (type: 'file' | 'directory'): void => {
  projectStore.CHANGE_ACTIVE_ITEM(props.projectTree)
  bus.emit('SIDEBAR::new', type)
}

const createFile = (): void => {
  startCreate('file')
}

const refreshProject = (): void => {
  projectStore.REFRESH_PROJECT()
}

const collapseAll = (): void => {
  showDirectories.value = true
  localStorage.setItem(SHOW_DIRECTORIES_KEY, 'true')
  bus.emit('SIDEBAR::collapse-all')
}

const handleRootContextMenu = (event: MouseEvent): void => {
  projectStore.CHANGE_ACTIVE_ITEM(props.projectTree)
  showContextMenu(event, !!clipboard.value)
}

const toggleOpenedFiles = (): void => {
  showOpenedFiles.value = !showOpenedFiles.value
  localStorage.setItem(SHOW_OPENED_FILES_KEY, String(showOpenedFiles.value))
}

const toggleDirectories = (): void => {
  showDirectories.value = !showDirectories.value
  localStorage.setItem(SHOW_DIRECTORIES_KEY, String(showDirectories.value))
}

// From createFileOrDirectoryMixins
const handleInputFocus = (): void => {
  nextTick(() => {
    if (input.value) {
      input.value.focus()
      createName.value = ''
    }
  })
}

const handleInputEnter = (): void => {
  projectStore.CREATE_FILE_DIRECTORY(createName.value)
}

onMounted(() => {
  bus.on('SIDEBAR::show-new-input', handleInputFocus)

  // Hide rename / create inputs on outside clicks. Buttons that open these
  // inputs must use @click.stop so their click never reaches this listener.
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (target && target.tagName !== 'INPUT') {
      projectStore.CHANGE_ACTIVE_ITEM({})
      projectStore.createCache = {}
      projectStore.renameCache = null
    }
  })

  document.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement | null
    if (target && target.tagName !== 'INPUT') {
      projectStore.createCache = {}
      projectStore.renameCache = null
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      projectStore.createCache = {}
      projectStore.renameCache = null
    }
  })
})
</script>

<style scoped>
.list-item {
  display: inline-block;
  margin-right: 10px;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s;
}
.list-enter, .list-leave-to
  /* .list-leave-active for below version 2.1.8 */ {
  opacity: 0;
  transform: translateX(-50px);
}
.tree-view {
  font-size: 14px;
  color: var(--sideBarColor);
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tree-view > .title {
  height: 35px;
  line-height: 35px;
  padding: 0 15px;
  display: flex;
  flex-shrink: 0;
  flex-direction: row-reverse;
}

.tree-view > .explorer-title {
  flex-direction: row;
  align-items: center;
  color: var(--sideBarTitleColor);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.workspace-projects {
  flex-shrink: 0;
  padding: 0 8px 8px;
  border-bottom: 1px solid var(--itemBgColor);
}

.workspace-projects-header {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 3px 0 7px;
  color: var(--sideBarTitleColor);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.workspace-projects-header > span {
  flex: 1;
}

.workspace-projects-header > button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: var(--sideBarIconColor);
  background: transparent;
  cursor: pointer;
}

.workspace-projects-header > button:hover,
.workspace-projects-header > button:focus-visible {
  color: var(--highlightThemeColor);
  background: var(--sideBarItemHoverBgColor);
  outline: none;
}

.workspace-projects-list {
  max-height: 128px;
  overflow: auto;
}

.workspace-projects-list > button {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: 5px;
  color: var(--sideBarColor);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.workspace-projects-list > button:hover,
.workspace-projects-list > button:focus-visible {
  background: var(--sideBarItemHoverBgColor);
  outline: none;
}

.workspace-projects-list > button.active {
  color: var(--highlightThemeColor);
  background: var(--sideBarItemHoverBgColor);
  font-weight: 600;
}

.workspace-projects-list::-webkit-scrollbar:vertical {
  width: 8px;
}

.icon-arrow {
  margin-right: 5px;
  transition: transform 0.25s ease-out;
  transform: rotate(90deg);
  color: var(--sideBarTextColor);
  cursor: pointer;
}

.icon-arrow.fold {
  transform: rotate(0);
}

.opened-files > .title,
.project-tree > .title {
  height: 30px;
  line-height: 30px;
  font-size: 14px;
}

.opened-files .title {
  padding-right: 15px;
  display: flex;
  align-items: center;
}

.opened-files .title > span {
  flex: 1;
}

.opened-files .title > a {
  display: none;
  text-decoration: none;
  color: var(--sideBarColor);
  margin-left: 8px;
}
.opened-files div.title:hover > a,
.opened-files div.title > a:hover {
  display: block;
}

.opened-files div.title:hover > a:hover,
.opened-files div.title > a:hover:hover {
  color: var(--highlightThemeColor);
}
.opened-files {
  display: flex;
  flex-direction: column;
}
.default-cursor {
  cursor: pointer;
}
.opened-files .opened-files-list {
  max-height: 112px;
  overflow: auto;
  flex: 1;
}

.opened-files .opened-files-list::-webkit-scrollbar:vertical {
  width: 8px;
}

.project-tree {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

.project-tree > .title {
  padding-right: 15px;
  display: flex;
  align-items: center;
}

.project-tree > .title > span {
  flex: 1;
  min-width: 0;
  user-select: none;
}

.project-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  pointer-events: none;
}

.project-tree > .title:hover .project-actions,
.project-actions:focus-within {
  opacity: 1;
  pointer-events: auto;
}

.project-actions > button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: var(--sideBarIconColor);
  background: transparent;
  cursor: pointer;
}

.project-actions > button:hover,
.project-actions > button:focus-visible {
  color: var(--highlightThemeColor);
  background: var(--sideBarItemHoverBgColor);
  outline: none;
}

.project-tree > .title > a {
  pointer-events: auto;
  cursor: pointer;
  margin-left: 8px;
  color: var(--sideBarIconColor);
  opacity: 0;
}

.project-tree > .title > a:hover {
  color: var(--highlightThemeColor);
}

.project-tree > .title > a.active {
  color: var(--highlightThemeColor);
}

.project-tree > .tree-wrapper {
  overflow: auto;
  flex: 1;
}

.project-tree > .tree-wrapper::-webkit-scrollbar:vertical {
  width: 8px;
}
.project-tree div.title:hover > a {
  opacity: 1;
}
.open-project {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 45px 18px 100px;
  overflow: auto;
}

.open-project .centered-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.open-project .el-button {
  margin-top: 0;
}

.recent-projects {
  width: 100%;
  margin-top: 34px;
}

.recent-projects-title {
  margin-bottom: 8px;
  color: var(--sideBarTitleColor);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.recent-projects > button {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: 3px;
  color: var(--sideBarColor);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.recent-projects > button:hover,
.recent-projects > button:focus-visible {
  background: var(--sideBarItemHoverBgColor);
  outline: none;
}
.open-project .el-button.is-text.is-has-bg,
.empty-project .el-button.is-text.is-has-bg {
  background-color: var(--buttonPrimaryBgColor);
  color: var(--buttonPrimaryFontColor);
  border-color: transparent;
}
.open-project .el-button.is-text.is-has-bg:hover,
.open-project .el-button.is-text.is-has-bg:focus,
.empty-project .el-button.is-text.is-has-bg:hover,
.empty-project .el-button.is-text.is-has-bg:focus {
  background-color: var(--buttonPrimaryBgColorHover);
  color: var(--buttonPrimaryFontColorHover);
}
.new-input {
  outline: none;
  height: 22px;
  margin: 5px 0;
  padding: 0 6px;
  color: var(--sideBarColor);
  border: 1px solid var(--floatBorderColor);
  background: var(--inputBgColor);
  width: calc(100% - 45px);
  border-radius: 3px;
}
.tree-wrapper {
  position: relative;
}
.empty-project {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  padding-top: 40px;
  align-items: center;
  color: var(--sideBarTextColor);
  & button {
    margin-top: 10px;
  }
}

.empty-project > a {
  color: var(--highlightThemeColor);
  text-align: center;
  margin-top: 15px;
  text-decoration: none;
}
.bold {
  font-weight: 600;
}
</style>
