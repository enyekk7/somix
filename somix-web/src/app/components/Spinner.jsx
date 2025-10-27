import { clsx } from 'clsx'

export function Spinner({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={clsx(
      'border-2 border-gray-600 border-t-purple-500 rounded-full animate-spin',
      sizeClasses[size],
      className
    )} />
  )
}


