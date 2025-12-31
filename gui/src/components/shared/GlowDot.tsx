import { cn } from '../../utils/cn'

export interface GlowDotProps {
  active?: boolean
  color?: 'accent' | 'violet' | 'green' | 'red'
  className?: string
}

const colorClasses = {
  accent: 'bg-accent shadow-[0_0_8px_rgba(255,122,89,0.8)]',
  violet: 'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]',
  green: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]',
  red: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]',
}

export function GlowDot({ active = true, color = 'accent', className }: GlowDotProps) {
  if (!active) return null

  return (
    <div
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        colorClasses[color],
        className
      )}
    />
  )
}
