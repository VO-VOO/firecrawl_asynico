# Firecrawl Scraper GUI - 开发文档

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈选型](#2-技术栈选型)
3. [项目结构](#3-项目结构)
4. [架构设计](#4-架构设计)
5. [组件设计](#5-组件设计)
6. [IPC 通信协议](#6-ipc-通信协议)
7. [状态管理](#7-状态管理)
8. [样式系统](#8-样式系统)
9. [开发里程碑](#9-开发里程碑)
10. [构建与部署](#10-构建与部署)

---

## 1. 项目概述

### 1.1 项目目标

为 Firecrawl 异步爬虫脚本提供一个 macOS 原生级别的图形界面，实现：

- 可视化监控爬取进度
- 实时展示并发任务状态
- 统计成功/失败数量
- 提供任务配置入口

### 1.2 设计理念

- **Bento Grid 布局**: 模块化卡片网格，信息层级分明
- **Edge Lighting**: 悬停时紫色边缘微光作为核心交互反馈
- **Monochrome + Micro-Accents**: 黑白灰主色调，紫色仅用于交互态，红色仅用于错误

### 1.3 当前状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目脚手架 | 已完成 | Electron + React + Vite + Tailwind |
| UI 静态布局 | 已完成 | Bento Grid + Hover Glow 基础实现 |
| Python 后端 | 已完成 | asyncio 异步爬虫脚本 |
| IPC 通信 | 待开发 | preload.js 框架已搭建 |
| 数据流联调 | 待开发 | - |

---

## 2. 技术栈选型

### 2.1 前端框架

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| **Electron** | 39.x | 跨平台桌面应用框架，支持 macOS 原生特性（vibrancy、trafficLightPosition） |
| **React** | 19.x | 组件化开发，生态成熟，配合 Hooks 实现响应式状态管理 |
| **TypeScript** | 5.9.x | 类型安全，提升代码可维护性和 IDE 智能提示 |
| **Vite** | 7.x | 极速 HMR，优化开发体验 |

### 2.2 样式方案

| 技术 | 选型理由 |
|------|----------|
| **Tailwind CSS** | 原子化 CSS，快速实现设计稿，配合 CSS Variables 支持主题切换 |
| **Framer Motion** | 声明式动画库，实现 Hover Glow、卡片过渡等高级动效 |
| **clsx + tailwind-merge** | 条件类名组合，避免样式冲突 |

### 2.3 后端通信

| 技术 | 选型理由 |
|------|----------|
| **child_process** | Node.js 原生模块，启动/管理 Python 子进程 |
| **JSON Lines (NDJSON)** | Python 输出格式，支持流式解析，每行一个 JSON 对象 |
| **IPC (contextBridge)** | Electron 安全通信方案，隔离渲染进程与主进程 |

### 2.4 依赖清单

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "framer-motion": "^12.23.26",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "electron": "^39.2.7",
    "vite": "^7.2.4",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.9.3"
  }
}
```

---

## 3. 项目结构

```
firecrawl_scraper/
├── docs/                          # 文档目录
│   ├── frontend_design_spec.md    # 视觉设计规范
│   ├── design_mockup.png          # UI 设计稿
│   └── DEVELOPMENT.md             # 本文档
│
├── gui/                           # 前端 GUI 项目
│   ├── electron/                  # Electron 主进程
│   │   ├── main.js                # 主进程入口
│   │   └── preload.js             # 预加载脚本（IPC 桥接）
│   │
│   ├── src/                       # React 应用源码
│   │   ├── main.tsx               # React 入口
│   │   ├── App.tsx                # 根组件
│   │   ├── index.css              # 全局样式
│   │   │
│   │   ├── components/            # UI 组件 (待创建)
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── BentoGrid.tsx
│   │   │   ├── cards/
│   │   │   │   ├── ProgressCard.tsx
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   └── ActiveTasksCard.tsx
│   │   │   ├── shared/
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── CircularProgress.tsx
│   │   │   │   └── TaskItem.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/                 # 自定义 Hooks (待创建)
│   │   │   ├── useScraperIPC.ts   # IPC 通信 Hook
│   │   │   └── useThrottle.ts     # 节流 Hook
│   │   │
│   │   ├── stores/                # 状态管理 (待创建)
│   │   │   └── scraperStore.ts    # Zustand store
│   │   │
│   │   ├── types/                 # TypeScript 类型 (待创建)
│   │   │   └── scraper.ts
│   │   │
│   │   └── utils/                 # 工具函数 (待创建)
│   │       └── cn.ts              # className 合并
│   │
│   ├── tailwind.config.js         # Tailwind 配置
│   ├── vite.config.ts             # Vite 配置
│   └── package.json
│
├── scrape_asyncio.py              # Python 爬虫脚本
├── pyproject.toml                 # Python 项目配置
└── README.md
```

---

## 4. 架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Electron Application                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┐         ┌─────────────────────────────────┐ │
│  │    Main Process    │         │       Renderer Process          │ │
│  │    (Node.js)       │         │       (React + Vite)            │ │
│  │                    │         │                                 │ │
│  │  ┌──────────────┐  │   IPC   │  ┌────────────────────────────┐ │ │
│  │  │ Python       │  │ ◄─────► │  │ React Components           │ │ │
│  │  │ Manager      │  │         │  │                            │ │ │
│  │  │              │  │         │  │  ┌─────────┐ ┌──────────┐  │ │ │
│  │  │ - spawn()    │  │         │  │  │ Sidebar │ │ BentoGrid│  │ │ │
│  │  │ - stdout     │  │         │  │  └─────────┘ └──────────┘  │ │ │
│  │  │ - kill()     │  │         │  │                            │ │ │
│  │  └──────────────┘  │         │  │  ┌──────────────────────┐  │ │ │
│  │         │          │         │  │  │    Zustand Store     │  │ │ │
│  │         ▼          │         │  │  │  - tasks[]           │  │ │ │
│  │  ┌──────────────┐  │         │  │  │  - progress          │  │ │ │
│  │  │ Python       │  │         │  │  │  - stats             │  │ │ │
│  │  │ Process      │  │         │  │  └──────────────────────┘  │ │ │
│  │  │ (asyncio)    │  │         │  └────────────────────────────┘ │ │
│  │  └──────────────┘  │         │                                 │ │
│  └────────────────────┘         └─────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 数据流设计

```
Python stdout (JSON Lines)
         │
         ▼
┌─────────────────┐
│  Main Process   │  解析 JSON Line
│  (Node.js)      │
└────────┬────────┘
         │ ipcMain.emit('scraper:progress', data)
         ▼
┌─────────────────┐
│  Preload.js     │  contextBridge 暴露 API
│  (Bridge)       │
└────────┬────────┘
         │ window.electron.receive('scraper:progress', callback)
         ▼
┌─────────────────┐
│  useScraperIPC  │  React Hook 处理 IPC 事件
│  (Hook)         │  节流 100ms 更新
└────────┬────────┘
         │ store.updateProgress(data)
         ▼
┌─────────────────┐
│  Zustand Store  │  全局状态管理
│  (State)        │
└────────┬────────┘
         │ useStore(selector)
         ▼
┌─────────────────┐
│  React UI       │  响应式渲染
│  (Components)   │
└─────────────────┘
```

---

## 5. 组件设计

### 5.1 组件层级

```
App
├── Sidebar
│   ├── Logo
│   ├── NavItem (Dashboard)
│   ├── NavItem (Tasks)
│   ├── NavItem (Crawler)
│   ├── NavItem (Settings)
│   └── ProfileBadge
│
└── MainContent
    └── BentoGrid
        ├── ProgressCard
        │   └── CircularProgress
        │
        ├── StatsCard
        │   ├── StatItem (Success)
        │   └── StatItem (Failed)
        │
        └── ActiveTasksCard
            ├── CardHeader
            ├── TaskGrid
            │   └── TaskItem (x N)
            └── ViewAllButton
```

### 5.2 核心组件 API

#### Card (基础卡片)

```typescript
interface CardProps {
  children: React.ReactNode
  className?: string
  hoverGlow?: boolean  // 是否启用悬停光效
  span?: number        // grid-cols 跨列数
}

// 使用示例
<Card span={4} hoverGlow>
  <CardContent />
</Card>
```

#### CircularProgress (环形进度条)

```typescript
interface CircularProgressProps {
  value: number          // 0-100
  size?: number          // 直径 (px)
  strokeWidth?: number   // 线条宽度 (px)
  trackColor?: string    // 轨道颜色
  fillColor?: string     // 填充颜色
  showLabel?: boolean    // 显示中心数字
  label?: string         // 自定义标签
}

// 使用示例
<CircularProgress
  value={85}
  size={160}
  showLabel
  label="1,250 / 1,470"
/>
```

#### TaskItem (任务项)

```typescript
interface TaskItemProps {
  id: string
  url: string
  title?: string
  progress: number       // 0-100
  status: 'pending' | 'running' | 'success' | 'failed'
}

// 使用示例
<TaskItem
  id="task-1"
  url="https://example.com/article"
  progress={45}
  status="running"
/>
```

### 5.3 组件样式规范

#### 卡片悬停光效 (Hover Glow)

```css
/* 默认态 */
.card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

/* 悬停态 */
.card:hover {
  border-color: rgba(176, 38, 255, 0.5);
  box-shadow:
    0 0 15px rgba(176, 38, 255, 0.2),
    inset 0 0 10px rgba(176, 38, 255, 0.05);
}
```

#### 选中态指示点 (Glow Dot)

```css
.nav-item-active::before {
  content: '';
  position: absolute;
  left: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #B026FF;
  box-shadow: 0 0 8px #B026FF;
}
```

---

## 6. IPC 通信协议

### 6.1 Channel 定义

| Channel | 方向 | 说明 |
|---------|------|------|
| `scraper:start` | Renderer -> Main | 启动爬虫 |
| `scraper:stop` | Renderer -> Main | 停止爬虫 |
| `scraper:progress` | Main -> Renderer | 进度更新 |
| `scraper:task-update` | Main -> Renderer | 单任务状态更新 |
| `scraper:complete` | Main -> Renderer | 爬取完成 |
| `scraper:error` | Main -> Renderer | 错误通知 |

### 6.2 数据结构

#### 启动请求 (scraper:start)

```typescript
interface StartRequest {
  configPath?: string       // 配置文件路径
  maxConcurrent?: number    // 最大并发数
  batchSize?: number        // 批次大小
}
```

#### 进度更新 (scraper:progress)

```typescript
interface ProgressUpdate {
  type: 'progress'
  timestamp: number
  data: {
    total: number           // 总任务数
    completed: number       // 已完成数
    success: number         // 成功数
    failed: number          // 失败数
    pending: number         // 待处理数
    running: number         // 运行中数
    percentage: number      // 进度百分比 (0-100)
    eta?: number            // 预计剩余时间 (秒)
  }
}
```

#### 任务更新 (scraper:task-update)

```typescript
interface TaskUpdate {
  type: 'task'
  timestamp: number
  data: {
    id: string              // 任务 ID
    index: number           // 任务索引
    url: string             // 目标 URL
    title: string           // 文章标题
    status: 'pending' | 'running' | 'success' | 'failed'
    progress?: number       // 进度 (0-100)
    error?: string          // 错误信息
    elapsed?: number        // 耗时 (秒)
  }
}
```

#### 完成通知 (scraper:complete)

```typescript
interface CompleteNotification {
  type: 'complete'
  timestamp: number
  data: {
    total: number
    success: number
    failed: number
    elapsed: number         // 总耗时 (秒)
    failedTasks: Array<{
      index: number
      url: string
      error: string
    }>
  }
}
```

### 6.3 Preload.js 实现

```javascript
// electron/preload.js
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('scraper', {
  // 启动爬虫
  start: (config) => ipcRenderer.invoke('scraper:start', config),

  // 停止爬虫
  stop: () => ipcRenderer.invoke('scraper:stop'),

  // 监听进度更新
  onProgress: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:progress', handler)
    return () => ipcRenderer.removeListener('scraper:progress', handler)
  },

  // 监听任务更新
  onTaskUpdate: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:task-update', handler)
    return () => ipcRenderer.removeListener('scraper:task-update', handler)
  },

  // 监听完成事件
  onComplete: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:complete', handler)
    return () => ipcRenderer.removeListener('scraper:complete', handler)
  },

  // 监听错误
  onError: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:error', handler)
    return () => ipcRenderer.removeListener('scraper:error', handler)
  }
})
```

### 6.4 Main.js Python 进程管理

```javascript
// electron/main.js (扩展)
import { spawn } from 'child_process'
import { createInterface } from 'readline'

let pythonProcess = null

ipcMain.handle('scraper:start', async (event, config) => {
  if (pythonProcess) {
    return { success: false, error: 'Scraper already running' }
  }

  const pythonPath = 'python3'  // 或使用 uv run
  const scriptPath = path.join(__dirname, '../../scrape_asyncio.py')

  pythonProcess = spawn(pythonPath, [scriptPath], {
    env: {
      ...process.env,
      GUI_MODE: 'true',  // 告诉 Python 输出 JSON Lines
      MAX_CONCURRENT: config.maxConcurrent?.toString() || '15'
    }
  })

  // 逐行解析 stdout (JSON Lines)
  const rl = createInterface({ input: pythonProcess.stdout })

  rl.on('line', (line) => {
    try {
      const data = JSON.parse(line)
      if (data.type === 'progress') {
        event.sender.send('scraper:progress', data)
      } else if (data.type === 'task') {
        event.sender.send('scraper:task-update', data)
      } else if (data.type === 'complete') {
        event.sender.send('scraper:complete', data)
      }
    } catch (e) {
      // 非 JSON 行，可能是普通日志
      console.log('[Python]', line)
    }
  })

  pythonProcess.stderr.on('data', (data) => {
    event.sender.send('scraper:error', { message: data.toString() })
  })

  pythonProcess.on('close', (code) => {
    pythonProcess = null
    if (code !== 0) {
      event.sender.send('scraper:error', { message: `Process exited with code ${code}` })
    }
  })

  return { success: true }
})

ipcMain.handle('scraper:stop', async () => {
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
    return { success: true }
  }
  return { success: false, error: 'No scraper running' }
})
```

---

## 7. 状态管理

### 7.1 Store 设计 (Zustand)

```typescript
// src/stores/scraperStore.ts
import { create } from 'zustand'

interface Task {
  id: string
  index: number
  url: string
  title: string
  status: 'pending' | 'running' | 'success' | 'failed'
  progress: number
  error?: string
  elapsed?: number
}

interface ScraperState {
  // 运行状态
  isRunning: boolean

  // 进度数据
  total: number
  completed: number
  success: number
  failed: number
  percentage: number

  // 任务列表 (只保留活跃任务，最多 50 条)
  activeTasks: Task[]

  // Actions
  setRunning: (running: boolean) => void
  updateProgress: (data: ProgressUpdate['data']) => void
  updateTask: (data: TaskUpdate['data']) => void
  reset: () => void
}

export const useScraperStore = create<ScraperState>((set) => ({
  isRunning: false,
  total: 0,
  completed: 0,
  success: 0,
  failed: 0,
  percentage: 0,
  activeTasks: [],

  setRunning: (running) => set({ isRunning: running }),

  updateProgress: (data) => set({
    total: data.total,
    completed: data.completed,
    success: data.success,
    failed: data.failed,
    percentage: data.percentage
  }),

  updateTask: (data) => set((state) => {
    const tasks = [...state.activeTasks]
    const idx = tasks.findIndex(t => t.id === data.id)

    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...data }
    } else {
      tasks.push(data as Task)
    }

    // 只保留最近的 50 条活跃任务
    const activeTasks = tasks
      .filter(t => t.status === 'running' || t.status === 'pending')
      .slice(-50)

    return { activeTasks }
  }),

  reset: () => set({
    isRunning: false,
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
    percentage: 0,
    activeTasks: []
  })
}))
```

### 7.2 IPC Hook

```typescript
// src/hooks/useScraperIPC.ts
import { useEffect, useCallback } from 'react'
import { useScraperStore } from '../stores/scraperStore'
import { useThrottle } from './useThrottle'

export function useScraperIPC() {
  const store = useScraperStore()

  // 节流更新，避免高频渲染
  const throttledUpdateProgress = useThrottle(store.updateProgress, 100)
  const throttledUpdateTask = useThrottle(store.updateTask, 50)

  useEffect(() => {
    const unsubProgress = window.scraper.onProgress(throttledUpdateProgress)
    const unsubTask = window.scraper.onTaskUpdate(throttledUpdateTask)
    const unsubComplete = window.scraper.onComplete(() => {
      store.setRunning(false)
    })
    const unsubError = window.scraper.onError((error) => {
      console.error('Scraper error:', error)
    })

    return () => {
      unsubProgress()
      unsubTask()
      unsubComplete()
      unsubError()
    }
  }, [])

  const start = useCallback(async (config = {}) => {
    store.reset()
    store.setRunning(true)
    const result = await window.scraper.start(config)
    if (!result.success) {
      store.setRunning(false)
    }
    return result
  }, [])

  const stop = useCallback(async () => {
    const result = await window.scraper.stop()
    if (result.success) {
      store.setRunning(false)
    }
    return result
  }, [])

  return { start, stop }
}
```

---

## 8. 样式系统

### 8.1 Tailwind 配置

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#1C1C1E',
        'sidebar-glass': '#1E1E1E',
        primary: '#FFFFFF',
        secondary: '#8E8E93',
        accent: '#B026FF',
        error: '#FF453A',
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(176, 38, 255, 0.2), inset 0 0 10px rgba(176, 38, 255, 0.05)',
        'glow-dot': '0 0 8px #B026FF',
      },
      backdropBlur: {
        xl: '20px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
```

### 8.2 CSS Variables (主题切换)

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-background: #0D0D0D;
  --color-surface: #1C1C1E;
  --color-sidebar: #1E1E1E;
  --color-primary: #FFFFFF;
  --color-secondary: #8E8E93;
  --color-accent: #B026FF;
  --color-error: #FF453A;
}

/* 可选：Light Mode */
[data-theme='light'] {
  --color-background: #F5F5F7;
  --color-surface: #FFFFFF;
  --color-sidebar: #F0F0F0;
  --color-primary: #1D1D1F;
  --color-secondary: #86868B;
}
```

### 8.3 工具函数

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 9. 开发里程碑

### Phase 1: 组件化重构 (1-2 天)

- [ ] 创建 `src/components/` 目录结构
- [ ] 抽离 `Sidebar` 组件
- [ ] 抽离 `Card` 基础组件
- [ ] 实现 `CircularProgress` 组件 (SVG)
- [ ] 抽离 `ProgressCard`、`StatsCard`、`ActiveTasksCard`
- [ ] 创建 `TaskItem` 组件

### Phase 2: 状态管理 (0.5 天)

- [ ] 安装 Zustand (`npm install zustand`)
- [ ] 创建 `scraperStore.ts`
- [ ] 定义 TypeScript 类型 (`src/types/scraper.ts`)
- [ ] 连接组件与 Store

### Phase 3: IPC 通信 (1-2 天)

- [ ] 扩展 `preload.js` 暴露完整 API
- [ ] 实现 `main.js` Python 进程管理
- [ ] 创建 `useScraperIPC` Hook
- [ ] 实现节流 Hook (`useThrottle`)
- [ ] 添加 TypeScript 声明文件 (`window.scraper`)

### Phase 4: Python 适配 (0.5 天)

- [ ] 修改 `scrape_asyncio.py` 支持 `GUI_MODE` 环境变量
- [ ] 输出 JSON Lines 格式的进度数据
- [ ] 添加任务级别的状态输出
- [ ] 支持优雅停止 (SIGTERM 处理)

### Phase 5: 联调与优化 (1-2 天)

- [ ] 端到端测试：启动 -> 运行 -> 完成
- [ ] 性能优化：渲染节流、虚拟列表
- [ ] 错误处理：进程崩溃、网络异常
- [ ] UI 微调：动画时序、响应式布局

### Phase 6: 功能扩展 (可选)

- [ ] 配置页面 (Settings)
- [ ] 任务历史记录 (Tasks 页面)
- [ ] 导出结果报告
- [ ] 多任务队列支持

---

## 10. 构建与部署

### 10.1 开发模式

```bash
cd gui

# 启动 Vite 开发服务器 + Electron
npm run dev:electron
```

### 10.2 生产构建

```bash
# 构建 React 应用
npm run build

# 打包 Electron 应用 (macOS)
npm run electron:build
```

### 10.3 Electron Builder 配置

```json
// package.json 添加
{
  "build": {
    "appId": "com.firecrawl.scraper",
    "productName": "Firecrawl Scraper",
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"],
      "icon": "build/icon.icns"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "extraResources": [
      {
        "from": "../scrape_asyncio.py",
        "to": "scripts/scrape_asyncio.py"
      }
    ]
  }
}
```

### 10.4 环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18.x | LTS 版本 |
| Python | 3.11+ | 运行爬虫脚本 |
| macOS | 12.0+ | 支持 vibrancy 特性 |

---

## 附录

### A. 设计资源

- 设计稿: `docs/design_mockup.png`
- 视觉规范: `docs/frontend_design_spec.md`

### B. 参考文档

- [Electron 文档](https://www.electronjs.org/docs)
- [React 19 文档](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)

### C. 相关命令

```bash
# 安装依赖
npm install zustand

# TypeScript 类型检查
npm run tsc --noEmit

# 代码格式化
npm run lint -- --fix
```
