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
