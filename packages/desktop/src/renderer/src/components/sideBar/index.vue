<template>
  <div
    v-show="showSideBar"
    ref="sideBar"
    class="side-bar"
    :class="[{ collapsed: !rightColumn }, { 'is-osx': isOsx }]"
    :style="[!rightColumn ? { 'min-width': '45px' } : {}, { width: `${finalSideBarWidth}px` }]"
  >
    <div class="left-column">
      <ul>
        <li
          v-for="(c, index) of sideBarIcons"
          :key="index"
          :class="{ active: c.id === rightColumn }"
          @click="handleLeftIconClick(c.id)"
        >
          <component :is="c.icon" />
        </li>
      </ul>
      <ul class="bottom">
        <li
          v-for="(c, index) of sideBarBottomIcons"
          :key="index"
          @click="handleLeftBottomClick(c.id)"
        >
          <component :is="c.icon" />
        </li>
      </ul>
    </div>
    <div
      v-show="rightColumn"
      class="right-column"
    >
      <tree
        v-if="rightColumn === 'files'"
        :project-tree="projectTree"
      />
      <side-bar-search v-else-if="rightColumn === 'search'" />
      <toc v-else-if="rightColumn === 'toc'" />
    </div>
    <div
      v-show="rightColumn"
      ref="dragBar"
      class="drag-bar"
    />
  </div>
  <Teleport to="body">
    <button
      v-show="showSideBar"
      type="button"
      class="sidebar-toggle"
      :style="{ left: `${sidebarToggleLeft}px` }"
      :title="sidebarToggleLabel"
      :aria-label="sidebarToggleLabel"
      @click.stop="toggleSidebarPanel"
    >
      <el-icon :size="17">
        <Expand v-if="!rightColumn" />
        <Fold v-else />
      </el-icon>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useLayoutStore } from '@/store/layout'
import { useProjectStore } from '@/store/project'
import { usePreferencesStore } from '@/store/preferences'
import { isOsx as isOsxPlatform } from '@/util'

import { sideBarIcons, sideBarBottomIcons } from './help'
import Tree from './tree.vue'
import SideBarSearch from './search.vue'
import Toc from './toc.vue'
import { storeToRefs } from 'pinia'
import { Expand, Fold } from '@element-plus/icons-vue'

const layoutStore = useLayoutStore()
const projectStore = useProjectStore()
const preferencesStore = usePreferencesStore()
const isOsx = isOsxPlatform

const sideBar = ref<HTMLDivElement | null>(null)
const dragBar = ref<HTMLDivElement | null>(null)

const sideBarViewWidth = ref(280)

const { rightColumn, showSideBar, sideBarWidth } = storeToRefs(layoutStore)

const { projectTree } = storeToRefs(projectStore)
const { language } = storeToRefs(preferencesStore)
const lastExpandedColumn = ref(rightColumn.value || 'files')

const sidebarToggleLabel = computed(() => {
  const isChinese = language.value.startsWith('zh')
  if (rightColumn.value) return isChinese ? '收起侧栏' : 'Collapse sidebar'
  return isChinese ? '展开侧栏' : 'Expand sidebar'
})

const finalSideBarWidth = computed<number>(() => {
  if (!showSideBar.value) return 0
  if (rightColumn.value === '') return 45
  return sideBarViewWidth.value < 220 ? 220 : sideBarViewWidth.value
})

const sidebarToggleLeft = computed<number>(() => {
  if (rightColumn.value) return finalSideBarWidth.value - 39
  return isOsx ? 106 : 7
})

onMounted(() => {
  nextTick(() => {
    const dragBarEl = dragBar.value
    if (!dragBarEl) return
    let startX = 0
    let currentSideBarWidth = +sideBarWidth.value
    let startWidth = currentSideBarWidth

    sideBarViewWidth.value = currentSideBarWidth

    const mouseUpHandler = (): void => {
      document.removeEventListener('mousemove', mouseMoveHandler, false)
      document.removeEventListener('mouseup', mouseUpHandler, false)
      layoutStore.CHANGE_SIDE_BAR_WIDTH(currentSideBarWidth < 220 ? 220 : currentSideBarWidth)
    }

    const mouseMoveHandler = (event: MouseEvent): void => {
      const offset = event.clientX - startX
      currentSideBarWidth = startWidth + offset
      sideBarViewWidth.value = currentSideBarWidth
    }

    const mouseDownHandler = (event: MouseEvent): void => {
      startX = event.clientX
      startWidth = +sideBarWidth.value
      document.addEventListener('mousemove', mouseMoveHandler, false)
      document.addEventListener('mouseup', mouseUpHandler, false)
    }

    dragBarEl.addEventListener('mousedown', mouseDownHandler, false)
  })
})

const handleLeftIconClick = (name: string): void => {
  if (rightColumn.value === name) {
    // Capture the expanded width BEFORE collapsing: once rightColumn is '',
    // finalSideBarWidth evaluates to the 45px icon strip and would overwrite
    // the user's real width with the clamped 220px minimum (#2421).
    const widthToPersist = finalSideBarWidth.value
    lastExpandedColumn.value = name
    layoutStore.SET_LAYOUT({ rightColumn: '' })
    layoutStore.CHANGE_SIDE_BAR_WIDTH(widthToPersist)
  } else {
    const needDispatch = rightColumn.value === ''
    layoutStore.SET_LAYOUT({ rightColumn: name })
    sideBarViewWidth.value = +sideBarWidth.value
    if (needDispatch) {
      layoutStore.CHANGE_SIDE_BAR_WIDTH(finalSideBarWidth.value)
    }
  }
}

const toggleSidebarPanel = (): void => {
  if (rightColumn.value) {
    const widthToPersist = finalSideBarWidth.value
    lastExpandedColumn.value = rightColumn.value
    layoutStore.SET_LAYOUT({ rightColumn: '' })
    layoutStore.CHANGE_SIDE_BAR_WIDTH(widthToPersist)
    return
  }

  layoutStore.SET_LAYOUT({ rightColumn: lastExpandedColumn.value || 'files' })
  sideBarViewWidth.value = +sideBarWidth.value
  layoutStore.CHANGE_SIDE_BAR_WIDTH(finalSideBarWidth.value)
}

const handleLeftBottomClick = (name: string): void => {
  if (name === 'settings') {
    projectStore.OPEN_SETTING_WINDOW()
  }
}
</script>

<style scoped>
.side-bar {
  display: flex;
  flex-shrink: 0;
  flex-grow: 0;
  width: 280px;
  height: 100vh;
  min-width: 220px;
  position: relative;
  color: var(--sideBarColor);
  user-select: none;
  background: var(--sideBarBgColor);
  border-right: 1px solid var(--itemBgColor);
  overflow: visible;
}

.sidebar-toggle {
  -webkit-app-region: no-drag;
  position: fixed;
  top: 7px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: var(--sideBarIconColor);
  background: transparent;
  cursor: pointer;
}

.sidebar-toggle:hover,
.sidebar-toggle:focus-visible {
  color: var(--highlightThemeColor);
  background: var(--sideBarItemHoverBgColor);
  outline: none;
}

.side-bar .left-column svg {
  color: var(--iconColor);
}

.left-column {
  height: 100%;
  width: 45px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 40px;
  box-sizing: border-box;
}

.side-bar.is-osx .left-column {
  padding-top: 48px;
}

.left-column > ul {
  opacity: 1;
}

.left-column ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.left-column ul > li {
  width: 45px;
  height: 45px;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  cursor: pointer;
}

.left-column ul > li > svg {
  width: 18px;
  height: 18px;
  color: var(--sideBarIconColor);
  opacity: 1;
  transition: transform 0.25s ease-in-out;
}

.left-column ul > li.active > svg {
  color: var(--themeColor);
}

.side-bar:hover .left-column ul li svg {
  opacity: 1;
}

.right-column {
  flex: 1;
  width: calc(100% - 50px);
  overflow: hidden;
  padding-top: 40px;
  box-sizing: border-box;
}

.side-bar.is-osx .right-column {
  padding-top: 48px;
}

.drag-bar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  width: 3px;
  cursor: col-resize;
}

.drag-bar:hover {
  border-right: 2px solid var(--iconColor);
}
</style>
