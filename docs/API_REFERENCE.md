# Firecrawl Scraper GUI - API 参考文档

## 目录

1. [IPC 通信接口](#1-ipc-通信接口)
2. [Python 输出协议](#2-python-输出协议)
3. [TypeScript 类型定义](#3-typescript-类型定义)
4. [组件 Props 接口](#4-组件-props-接口)
5. [Store 接口](#5-store-接口)

---

## 1. IPC 通信接口

### 1.1 Window API (Renderer -> Main)

通过 `preload.js` 暴露到 `window.scraper` 对象。

#### scraper.start(config)

启动爬虫进程。

```typescript
interface StartConfig {
  configPath?: string       // 自定义配置文件路径
  maxConcurrent?: number    // 最大并发数 (默认: 15)
  batchSize?: number        // 批次大小 (默认: 50)
  timeout?: number          // 请求超时 (秒, 默认: 60)
}

interface StartResult {
  success: boolean
  error?: string
}

// 示例
const result = await window.scraper.start({
  maxConcurrent: 10,
  batchSize: 25
})
```

#### scraper.stop()

停止正在运行的爬虫进程。

```typescript
interface StopResult {
  success: boolean
  error?: string
}

// 示例
const result = await window.scraper.stop()
```

#### scraper.onProgress(callback)

订阅进度更新事件。

```typescript
type ProgressCallback = (data: ProgressUpdate) => void

// 返回取消订阅函数
const unsubscribe = window.scraper.onProgress((data) => {
  console.log(`Progress: ${data.percentage}%`)
})

// 取消订阅
unsubscribe()
```

#### scraper.onTaskUpdate(callback)

订阅单个任务状态更新。

```typescript
type TaskCallback = (data: TaskUpdate) => void

const unsubscribe = window.scraper.onTaskUpdate((data) => {
  console.log(`Task ${data.index}: ${data.status}`)
})
```

#### scraper.onComplete(callback)

订阅爬取完成事件。

```typescript
type CompleteCallback = (data: CompleteNotification) => void

const unsubscribe = window.scraper.onComplete((data) => {
  console.log(`Completed: ${data.success}/${data.total}`)
})
```

#### scraper.onError(callback)

订阅错误事件。

```typescript
type ErrorCallback = (error: { message: string; code?: number }) => void

const unsubscribe = window.scraper.onError((error) => {
  console.error(`Error: ${error.message}`)
})
```

---

## 2. Python 输出协议

Python 脚本在 `GUI_MODE=true` 时输出 JSON Lines 格式数据。

### 2.1 进度更新 (progress)

每 100ms 或状态变化时输出。

```json
{
  "type": "progress",
  "timestamp": 1703930400000,
  "data": {
    "total": 1470,
    "completed": 1250,
    "success": 1220,
    "failed": 30,
    "pending": 150,
    "running": 15,
    "percentage": 85.03,
    "eta": 120
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| total | number | 总任务数 |
| completed | number | 已完成数 (success + failed) |
| success | number | 成功数 |
| failed | number | 失败数 |
| pending | number | 等待中数量 |
| running | number | 运行中数量 |
| percentage | number | 百分比 (0-100, 保留2位小数) |
| eta | number | 预计剩余秒数 (可选) |

### 2.2 任务更新 (task)

任务状态变化时输出。

```json
{
  "type": "task",
  "timestamp": 1703930400000,
  "data": {
    "id": "task-0042",
    "index": 42,
    "url": "https://example.com/article/42",
    "title": "Article Title Here",
    "status": "running",
    "progress": 50,
    "error": null,
    "elapsed": 2.5
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一任务 ID |
| index | number | 任务索引 (1-based) |
| url | string | 目标 URL |
| title | string | 文章标题 |
| status | enum | `pending` / `running` / `success` / `failed` |
| progress | number | 进度百分比 (0-100) |
| error | string | 错误信息 (仅 failed 状态) |
| elapsed | number | 已耗时 (秒) |

### 2.3 完成通知 (complete)

全部任务结束时输出。

```json
{
  "type": "complete",
  "timestamp": 1703930400000,
  "data": {
    "total": 1470,
    "success": 1440,
    "failed": 30,
    "elapsed": 3600.5,
    "failedTasks": [
      {
        "index": 42,
        "url": "https://example.com/article/42",
        "title": "Failed Article",
        "error": "Connection timeout"
      }
    ]
  }
}
```

### 2.4 Python 实现示例

```python
import json
import sys
import os
from datetime import datetime

GUI_MODE = os.environ.get('GUI_MODE', 'false').lower() == 'true'

def emit_json(data: dict):
    """输出 JSON Line 到 stdout"""
    if GUI_MODE:
        print(json.dumps(data, ensure_ascii=False), flush=True)

def emit_progress(total, completed, success, failed, pending, running):
    """输出进度更新"""
    emit_json({
        "type": "progress",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "data": {
            "total": total,
            "completed": completed,
            "success": success,
            "failed": failed,
            "pending": pending,
            "running": running,
            "percentage": round(completed / total * 100, 2) if total > 0 else 0
        }
    })

def emit_task_update(index, url, title, status, progress=0, error=None, elapsed=0):
    """输出任务状态更新"""
    emit_json({
        "type": "task",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "data": {
            "id": f"task-{index:04d}",
            "index": index,
            "url": url,
            "title": title,
            "status": status,
            "progress": progress,
            "error": error,
            "elapsed": elapsed
        }
    })

def emit_complete(total, success, failed, elapsed, failed_tasks):
    """输出完成通知"""
    emit_json({
        "type": "complete",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "data": {
            "total": total,
            "success": success,
            "failed": failed,
            "elapsed": elapsed,
            "failedTasks": failed_tasks
        }
    })
```

---

## 3. TypeScript 类型定义

### 3.1 完整类型文件

```typescript
// src/types/scraper.ts

// ============ IPC Message Types ============

export type MessageType = 'progress' | 'task' | 'complete' | 'error'

export interface BaseMessage {
  type: MessageType
  timestamp: number
}

// Progress Update
export interface ProgressData {
  total: number
  completed: number
  success: number
  failed: number
  pending: number
  running: number
  percentage: number
  eta?: number
}

export interface ProgressUpdate extends BaseMessage {
  type: 'progress'
  data: ProgressData
}

// Task Update
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed'

export interface TaskData {
  id: string
  index: number
  url: string
  title: string
  status: TaskStatus
  progress: number
  error?: string
  elapsed?: number
}

export interface TaskUpdate extends BaseMessage {
  type: 'task'
  data: TaskData
}

// Complete Notification
export interface FailedTask {
  index: number
  url: string
  title: string
  error: string
}

export interface CompleteData {
  total: number
  success: number
  failed: number
  elapsed: number
  failedTasks: FailedTask[]
}

export interface CompleteNotification extends BaseMessage {
  type: 'complete'
  data: CompleteData
}

// Error
export interface ErrorNotification extends BaseMessage {
  type: 'error'
  message: string
  code?: number
}

// Union Type
export type ScraperMessage =
  | ProgressUpdate
  | TaskUpdate
  | CompleteNotification
  | ErrorNotification

// ============ API Types ============

export interface StartConfig {
  configPath?: string
  maxConcurrent?: number
  batchSize?: number
  timeout?: number
}

export interface ApiResult {
  success: boolean
  error?: string
}

// ============ Window API Declaration ============

export interface ScraperAPI {
  start: (config?: StartConfig) => Promise<ApiResult>
  stop: () => Promise<ApiResult>
  onProgress: (callback: (data: ProgressUpdate) => void) => () => void
  onTaskUpdate: (callback: (data: TaskUpdate) => void) => () => void
  onComplete: (callback: (data: CompleteNotification) => void) => () => void
  onError: (callback: (error: { message: string; code?: number }) => void) => () => void
}

declare global {
  interface Window {
    scraper: ScraperAPI
  }
}
```

---

## 4. 组件 Props 接口

### 4.1 Card

```typescript
// src/components/shared/Card.tsx

import { ReactNode } from 'react'
import { MotionProps } from 'framer-motion'

export interface CardProps extends MotionProps {
  children: ReactNode
  className?: string
  hoverGlow?: boolean           // 启用悬停光效 (默认: true)
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12  // Grid 跨列数
  onClick?: () => void
}
```

### 4.2 CircularProgress

```typescript
// src/components/shared/CircularProgress.tsx

export interface CircularProgressProps {
  value: number                 // 0-100
  size?: number                 // 直径 px (默认: 120)
  strokeWidth?: number          // 线条宽度 px (默认: 8)
  trackColor?: string           // 轨道颜色 (默认: #333)
  fillColor?: string            // 填充颜色 (默认: #FFF)
  showLabel?: boolean           // 显示百分比 (默认: true)
  label?: ReactNode             // 自定义中心内容
  className?: string
}
```

### 4.3 TaskItem

```typescript
// src/components/shared/TaskItem.tsx

import { TaskStatus } from '../types/scraper'

export interface TaskItemProps {
  id: string
  url: string
  title?: string
  progress: number              // 0-100
  status: TaskStatus
  className?: string
  onClick?: () => void
}
```

### 4.4 Sidebar

```typescript
// src/components/layout/Sidebar.tsx

export type NavItemKey = 'dashboard' | 'tasks' | 'crawler' | 'settings'

export interface SidebarProps {
  activeItem?: NavItemKey
  onNavigate?: (item: NavItemKey) => void
  className?: string
}
```

### 4.5 StatsCard

```typescript
// src/components/cards/StatsCard.tsx

export interface StatsCardProps {
  success: number
  failed: number
  className?: string
}
```

### 4.6 ProgressCard

```typescript
// src/components/cards/ProgressCard.tsx

export interface ProgressCardProps {
  percentage: number            // 0-100
  completed: number
  total: number
  className?: string
}
```

### 4.7 ActiveTasksCard

```typescript
// src/components/cards/ActiveTasksCard.tsx

import { TaskData } from '../types/scraper'

export interface ActiveTasksCardProps {
  tasks: TaskData[]
  maxDisplay?: number           // 最多显示数量 (默认: 12)
  onViewAll?: () => void
  className?: string
}
```

---

## 5. Store 接口

### 5.1 Zustand Store

```typescript
// src/stores/scraperStore.ts

import { TaskData, ProgressData, CompleteData } from '../types/scraper'

export interface ScraperState {
  // 运行状态
  isRunning: boolean
  isCompleted: boolean

  // 进度数据
  progress: ProgressData | null

  // 活跃任务 (最多保留 50 条)
  activeTasks: TaskData[]

  // 完成数据
  completeData: CompleteData | null

  // 错误信息
  lastError: string | null
}

export interface ScraperActions {
  // 状态更新
  setRunning: (running: boolean) => void
  updateProgress: (data: ProgressData) => void
  updateTask: (data: TaskData) => void
  setComplete: (data: CompleteData) => void
  setError: (error: string) => void

  // 重置
  reset: () => void

  // 清除错误
  clearError: () => void
}

export type ScraperStore = ScraperState & ScraperActions
```

### 5.2 Selectors

```typescript
// 推荐使用 selector 避免不必要的重渲染

import { useScraperStore } from '../stores/scraperStore'

// 只订阅 percentage
const percentage = useScraperStore((state) => state.progress?.percentage ?? 0)

// 只订阅 success/failed
const stats = useScraperStore((state) => ({
  success: state.progress?.success ?? 0,
  failed: state.progress?.failed ?? 0
}))

// 只订阅运行状态
const isRunning = useScraperStore((state) => state.isRunning)
```

### 5.3 Store 实现参考

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const MAX_ACTIVE_TASKS = 50

export const useScraperStore = create<ScraperStore>()(
  immer((set) => ({
    // Initial State
    isRunning: false,
    isCompleted: false,
    progress: null,
    activeTasks: [],
    completeData: null,
    lastError: null,

    // Actions
    setRunning: (running) =>
      set((state) => {
        state.isRunning = running
        if (running) {
          state.isCompleted = false
        }
      }),

    updateProgress: (data) =>
      set((state) => {
        state.progress = data
      }),

    updateTask: (data) =>
      set((state) => {
        const idx = state.activeTasks.findIndex((t) => t.id === data.id)

        if (idx >= 0) {
          state.activeTasks[idx] = data
        } else {
          state.activeTasks.push(data)
        }

        // 移除已完成的任务，只保留活跃任务
        state.activeTasks = state.activeTasks
          .filter((t) => t.status === 'running' || t.status === 'pending')
          .slice(-MAX_ACTIVE_TASKS)
      }),

    setComplete: (data) =>
      set((state) => {
        state.isRunning = false
        state.isCompleted = true
        state.completeData = data
      }),

    setError: (error) =>
      set((state) => {
        state.lastError = error
      }),

    reset: () =>
      set((state) => {
        state.isRunning = false
        state.isCompleted = false
        state.progress = null
        state.activeTasks = []
        state.completeData = null
        state.lastError = null
      }),

    clearError: () =>
      set((state) => {
        state.lastError = null
      })
  }))
)
```

---

## 附录: 常量定义

```typescript
// src/constants/index.ts

// 颜色
export const COLORS = {
  BACKGROUND: '#0D0D0D',
  SURFACE: '#1C1C1E',
  SIDEBAR: '#1E1E1E',
  PRIMARY: '#FFFFFF',
  SECONDARY: '#8E8E93',
  ACCENT: '#B026FF',
  ERROR: '#FF453A',
} as const

// 动画时长
export const DURATIONS = {
  HOVER: 0.3,
  TRANSITION: 0.2,
  PROGRESS: 0.5,
} as const

// 限制
export const LIMITS = {
  MAX_ACTIVE_TASKS: 50,
  MAX_DISPLAY_TASKS: 12,
  THROTTLE_PROGRESS_MS: 100,
  THROTTLE_TASK_MS: 50,
} as const

// 默认配置
export const DEFAULTS = {
  MAX_CONCURRENT: 15,
  BATCH_SIZE: 50,
  TIMEOUT: 60,
} as const
```
