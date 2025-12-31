import { useCallback, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0)
  const lastArgs = useRef<Parameters<T> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCall.current

      if (timeSinceLastCall >= delay) {
        lastCall.current = now
        callback(...args)
      } else {
        // 保存最新参数，延迟执行
        lastArgs.current = args

        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (lastArgs.current) {
              lastCall.current = Date.now()
              callback(...lastArgs.current)
              lastArgs.current = null
            }
            timeoutRef.current = null
          }, delay - timeSinceLastCall)
        }
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * 批处理节流：收集多个调用，批量执行
 * 适用于需要处理每个调用但想减少更新频率的场景
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBatchThrottle<T extends (item: any) => void>(
  callback: (items: Parameters<T>[0][]) => void,
  delay: number
): T {
  const batchRef = useRef<Parameters<T>[0][]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    ((item: Parameters<T>[0]) => {
      batchRef.current.push(item)

      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          if (batchRef.current.length > 0) {
            callback(batchRef.current)
            batchRef.current = []
          }
          timeoutRef.current = null
        }, delay)
      }
    }) as T,
    [callback, delay]
  )
}
