import { useEffect, useCallback } from 'react'
import { useScraperStore } from '../stores/scraperStore'
import { useThrottle } from './useThrottle'
import type { StartConfig } from '../types/scraper'

export function useScraperIPC() {
  const store = useScraperStore()

  // 节流更新
  const throttledUpdateProgress = useThrottle(
    store.updateProgress,
    100
  )

  const throttledUpdateTask = useThrottle(
    store.updateTask,
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
      throttledUpdateTask(msg.data)
    })

    const unsubComplete = window.scraper.onComplete((msg) => {
      store.setComplete(msg.data)
    })

    const unsubError = window.scraper.onError((error) => {
      store.setError(error.message)
    })

    return () => {
      unsubProgress()
      unsubTask()
      unsubComplete()
      unsubError()
    }
  }, [throttledUpdateProgress, throttledUpdateTask, store])

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
