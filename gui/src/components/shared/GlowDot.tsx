import { cn } from '../../utils/cn'

export interface GlowDotProps {
  active?: boolean
  className?: string
}

export function GlowDot({ active = true, className }: GlowDotProps) {
  if (!active) return null

  return (
    <div
      className={cn(
        'w-1 h-1 rounded-full bg-accent',
        'shadow-[0_0_8px_#B026FF]',
        className
      )}
    />
  )
}
