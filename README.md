<h1 align="center">orangeMarkdown</h1>

<p align="center">一个所见即所得的 Markdown 编辑器,项目/工作区优先,暖橙极简风。</p>

---

## 简介

orangeMarkdown 是一个桌面 Markdown 编辑器,面向"把一个文件夹当项目来写作"的工作流。它在开源编辑器 [MarkText](https://github.com/marktext/marktext) 的基础上定制而来,主要改动:

- **强绑定项目**:不存在无路径的空白窗口。启动即进入"打开项目"欢迎屏,选定一个文件夹后才进入编辑器。
- **Plume 主题**:原创的暖白极简配色,适合长文阅读与写作。
- **项目资源管理器**:类 VS Code 的左侧资源管理器 —— 工作区根、悬停操作(新建文件/文件夹、刷新、全部折叠)、缩进引导线、当前文件高亮、最近项目与启动恢复。
- **原创品牌与图标**。

保留 MarkText 原有的编辑能力:所见即所得实时预览、源码模式、专注模式、打字机模式、大纲、数学公式(KaTeX)、Mermaid 图、代码高亮、导出。

## 技术栈

Electron 42 + Vue 3 + Vite(electron-vite),编辑器引擎为 muya,pnpm monorepo。

## 开发

```bash
pnpm install
pnpm --filter marktext dev                                   # 开发态
pnpm --filter marktext build                                 # 构建
pnpm --filter marktext exec electron-builder --mac --arm64   # 打包 macOS
```

## 致谢与许可

本项目基于 **[MarkText](https://github.com/marktext/marktext)**(MIT License,Copyright © 2017-present Luo Ran)定制。上游的 MIT 许可与版权声明完整保留于 [`LICENSE`](./LICENSE)。orangeMarkdown 新增的定制部分同样以 MIT 许可发布。

界面、主题、图标均为原创实现;对 Typora、VS Code 的交互理念有所借鉴,但未使用其受版权保护的资源或源码。
