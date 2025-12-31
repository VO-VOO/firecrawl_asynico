import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TaskData, ProgressData, CompleteData } from '../types/scraper'

const MAX_TASKS = 100

export type TaskFilterType = 'all' | 'success' | 'failed'

export interface ScraperState {
  // 运行状态
  isRunning: boolean
  isCompleted: boolean

  // 进度数据
  progress: ProgressData | null

  // 所有任务（包括已完成的）
  allTasks: TaskData[]

  // 完成数据
  completeData: CompleteData | null

  // 错误信息
  lastError: string | null

  // 当前页面
  currentPage: 'dashboard' | 'tasks' | 'settings'

  // 任务筛选器
  taskFilter: TaskFilterType

  // 导入的 JSON 文件信息
  importedFile: {
    path: string
    articleCount: number
  } | null
}

export interface ScraperActions {
  // 状态更新
  setRunning: (running: boolean) => void
  updateProgress: (data: ProgressData) => void
  updateTask: (data: TaskData) => void
  updateTasksBatch: (tasks: TaskData[]) => void
  setComplete: (data: CompleteData) => void
  setError: (error: string) => void

  // 导航
  setCurrentPage: (page: ScraperState['currentPage']) => void

  // 任务筛选
  setTaskFilter: (filter: TaskFilterType) => void

  // 导入文件
  setImportedFile: (file: ScraperState['importedFile']) => void

  // 重置
  reset: () => void

  // 清除错误
  clearError: () => void
}

export type ScraperStore = ScraperState & ScraperActions

const initialState: ScraperState = {
  isRunning: false,
  isCompleted: false,
  progress: null,
  allTasks: [],
  completeData: null,
  lastError: null,
  currentPage: 'dashboard',
  taskFilter: 'all',
  importedFile: null,
}

export const useScraperStore = create<ScraperStore>()(
  immer((set) => ({
    // Initial State
    ...initialState,

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
        const idx = state.allTasks.findIndex((t) => t.id === data.id)

        if (idx >= 0) {
          // 更新现有任务
          state.allTasks[idx] = data
        } else {
          // 添加新任务
          state.allTasks.push(data)
        }

        // 限制任务数量，但保留最新的
        if (state.allTasks.length > MAX_TASKS) {
          state.allTasks = state.allTasks.slice(-MAX_TASKS)
        }
      }),

    updateTasksBatch: (tasks) =>
      set((state) => {
        // 创建 ID -> 任务 的映射用于快速查找
        const taskMap = new Map(state.allTasks.map((t) => [t.id, t]))

        // 批量更新/添加任务
        for (const task of tasks) {
          taskMap.set(task.id, task)
        }

        // 转换回数组
        state.allTasks = Array.from(taskMap.values())

        // 限制任务数量，但保留最新的
        if (state.allTasks.length > MAX_TASKS) {
          state.allTasks = state.allTasks.slice(-MAX_TASKS)
        }
      }),

    setComplete: (data) =>
      set((state) => {
        state.isRunning = false
        state.isCompleted = true
        state.completeData = data

        // 获取失败任务的 ID 列表
        const failedIds = new Set(
          data.failedTasks?.map((t) => `task-${String(t.index).padStart(4, '0')}`) || []
        )

        // 更新所有 running/pending 任务的最终状态
        state.allTasks = state.allTasks.map((task) => {
          if (task.status === 'running' || task.status === 'pending') {
            return {
              ...task,
              status: failedIds.has(task.id) ? 'failed' : 'success',
              progress: 100,
            }
          }
          return task
        })
      }),

    setError: (error) =>
      set((state) => {
        state.lastError = error
      }),

    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page
      }),

    setTaskFilter: (filter) =>
      set((state) => {
        state.taskFilter = filter
      }),

    setImportedFile: (file) =>
      set((state) => {
        state.importedFile = file
      }),

    reset: () =>
      set((state) => {
        state.isRunning = false
        state.isCompleted = false
        state.progress = null
        state.allTasks = []
        state.completeData = null
        state.lastError = null
      }),

    clearError: () =>
      set((state) => {
        state.lastError = null
      }),
  }))
)
