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
  articlesFile?: string
  outputDir?: string
  firecrawlUrl?: string
  firecrawlApiKey?: string
  maxConcurrent?: number
  batchSize?: number
  timeout?: number
}

export interface ApiResult {
  success: boolean
  error?: string
}

export interface JsonReadResult {
  success: boolean
  data?: unknown
  path?: string
  error?: string
}

export interface AppConfig {
  outputDir: string
  firecrawlUrl: string
  firecrawlApiKey: string
}

// ============ Window API Declaration ============

export interface ScraperAPI {
  // 爬虫控制
  start: (config?: StartConfig) => Promise<ApiResult>
  stop: () => Promise<ApiResult>
  onProgress: (callback: (data: ProgressUpdate) => void) => () => void
  onTaskUpdate: (callback: (data: TaskUpdate) => void) => () => void
  onComplete: (callback: (data: CompleteNotification) => void) => () => void
  onError: (callback: (error: { message: string; code?: number }) => void) => () => void
  onStopped: (callback: (data: { code: number | null }) => void) => () => void

  // 文件操作
  selectJsonFile: () => Promise<string | null>
  readJsonFile: (filePath: string) => Promise<JsonReadResult>
  selectDirectory: () => Promise<string | null>

  // 配置管理
  getConfig: () => Promise<AppConfig>
  saveConfig: (config: AppConfig) => Promise<ApiResult>
}

declare global {
  interface Window {
    scraper: ScraperAPI
  }
}
