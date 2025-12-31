import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  hoverGlow?: boolean
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12
}

const spanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  6: 'col-span-6',
  8: 'col-span-8',
  12: 'col-span-12',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hoverGlow = true, span = 12, ...props }, ref) => {
    const baseClass = cn(
      // Apple-style glass morphism with purple accent
      'rounded-2xl p-6',
      'bg-[rgba(20,15,35,0.6)] backdrop-blur-xl',
      'border border-white/[0.06]',
      'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      spanClasses[span],
      className
    )

    if (!hoverGlow) {
      return (
        <div ref={ref} className={baseClass}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseClass, 'relative group')}
        whileHover={{
          borderColor: 'rgba(139, 92, 246, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.1)',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'
