import { useEffect, useCallback } from 'react'
import { useScraperStore } from '../stores/scraperStore'
import { useThrottle, useBatchThrottle } from './useThrottle'
import type { StartConfig, TaskData } from '../types/scraper'

export function useScraperIPC() {
  const store = useScraperStore()

  // 节流更新进度（进度是聚合数据，丢弃中间值没问题）
  const throttledUpdateProgress = useThrottle(
    store.updateProgress,
    100
  )

  // 批处理更新任务（收集所有任务更新，不丢弃任何一个）
  const batchUpdateTasks = useBatchThrottle<(task: TaskData) => void>(
    store.updateTasksBatch,
    50
  )

  // 订阅 IPC 事件
  useEffect(() => {
    if (!window.scraper) {
      console.warn('window.scraper is not available - running outside Electron?')
      return
    }

    const unsubProgress = window.scraper.onProgress((msg) => {
      throttledUpdateProgress(msg.data)
    })

    const unsubTask = window.scraper.onTaskUpdate((msg) => {
      // 使用批处理，确保每个任务更新都被处理
      batchUpdateTasks(msg.data)
    })

    const unsubComplete = window.scraper.onComplete((msg) => {
      store.setComplete(msg.data)
    })

    const unsubError = window.scraper.onError((error) => {
      store.setError(error.message)
    })

    // 监听进程停止（作为 complete 的备份）
    const unsubStopped = window.scraper.onStopped?.(() => {
      // 确保状态被设置为非运行，即使 complete 消息丢失
      store.setRunning(false)
    })

    return () => {
      unsubProgress()
      unsubTask()
      unsubComplete()
      unsubError()
      unsubStopped?.()
    }
  }, [throttledUpdateProgress, batchUpdateTasks, store])

  // 启动爬虫
  const start = useCallback(async (config: StartConfig = {}) => {
    if (!window.scraper) {
      console.error('window.scraper is not available')
      store.setError('Scraper API not available - please run in Electron')
      return { success: false, error: 'Scraper API not available' }
    }

    store.reset()
    store.setRunning(true)

    try {
      const result = await window.scraper.start(config)
      if (!result.success) {
        store.setRunning(false)
        store.setError(result.error || 'Failed to start')
      }
      return result
    } catch (e) {
      store.setRunning(false)
      store.setError(String(e))
      return { success: false, error: String(e) }
    }
  }, [store])

  // 停止爬虫
  const stop = useCallback(async () => {
    if (!window.scraper) {
      console.error('window.scraper is not available')
      return { success: false, error: 'Scraper API not available' }
    }

    try {
      const result = await window.scraper.stop()
      if (result.success) {
        store.setRunning(false)
      }
      return result
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }, [store])

  return { start, stop }
}
