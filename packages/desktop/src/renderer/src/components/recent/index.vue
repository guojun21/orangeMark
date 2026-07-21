<template>
  <div class="recent-files-projects">
    <div class="centered-group">
      <div class="welcome-title">{{ welcomeTitle }}</div>
      <div class="welcome-description">{{ welcomeDescription }}</div>
      <el-button
        text
        bg
        type="primary"
        @click="openFolder"
      >
        {{ t('sideBar.tree.openFolder') }}
      </el-button>
      <div
        v-if="recentlyOpenedFolders.length"
        class="recent-projects"
      >
        <div class="recent-projects-title">{{ recentProjectsTitle }}</div>
        <button
          v-for="pathname of recentlyOpenedFolders"
          :key="pathname"
          type="button"
          :title="pathname"
          @click="openRecentProject(pathname)"
        >
          <el-icon :size="16"><FolderOpened /></el-icon>
          <span>{{ projectName(pathname) }}</span>
          <small>{{ pathname }}</small>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { FolderOpened } from '@element-plus/icons-vue'
import { usePreferencesStore } from '@/store/preferences'
import { useProjectStore } from '@/store/project'
import { t } from '../../i18n'

const preferencesStore = usePreferencesStore()
const projectStore = useProjectStore()
const { language, recentlyOpenedFolders } = storeToRefs(preferencesStore)

const isChinese = computed(() => language.value.startsWith('zh'))
const welcomeTitle = computed(() => isChinese.value ? '打开一个项目' : 'Open a project')
const welcomeDescription = computed(() => isChinese.value
  ? '选择一个文件夹后才能进入编辑器。'
  : 'Choose a folder before entering the editor.')
const recentProjectsTitle = computed(() => isChinese.value ? '最近项目' : 'Recent projects')

const openFolder = (): void => {
  projectStore.ASK_FOR_OPEN_PROJECT()
}

const openRecentProject = (pathname: string): void => {
  projectStore.ASK_FOR_OPEN_PROJECT_PATH(pathname)
}

const projectName = (pathname: string): string => {
  return window.path.basename(pathname) || pathname
}
</script>

<style scoped>
.recent-files-projects {
  background: var(--editorBgColor);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  & .centered-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(560px, calc(100% - 48px));
    color: var(--editorColor);
    & .el-button {
      margin-top: 20px;
    }
    & .el-button.is-text.is-has-bg {
      background-color: var(--buttonPrimaryBgColor);
      color: var(--buttonPrimaryFontColor);
      border-color: transparent;
    }
    & .el-button.is-text.is-has-bg:hover,
    & .el-button.is-text.is-has-bg:focus {
      background-color: var(--buttonPrimaryBgColorHover);
      color: var(--buttonPrimaryFontColorHover);
    }
  }
}

.welcome-title {
  font-size: 26px;
  font-weight: 600;
}

.welcome-description {
  margin-top: 8px;
  color: var(--editorColor50);
}

.recent-projects {
  width: 100%;
  margin-top: 38px;
}

.recent-projects-title {
  margin-bottom: 8px;
  color: var(--editorColor50);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.recent-projects > button {
  display: grid;
  grid-template-columns: 22px minmax(120px, 1fr) minmax(180px, 2fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 4px;
  color: var(--editorColor);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.recent-projects > button:hover,
.recent-projects > button:focus-visible {
  background: var(--sideBarItemHoverBgColor);
  outline: none;
}

.recent-projects > button span,
.recent-projects > button small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-projects > button small {
  color: var(--editorColor50);
}
</style>
