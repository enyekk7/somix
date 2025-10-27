import { clsx } from 'clsx'

export function Avatar({ src, alt, size = 'md', className, isVerified, isSomixPro }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const fallbackText = alt.slice(0, 2).toUpperCase()
  
  const badgeSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div className={clsx(
        'rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold',
        sizeClasses[size],
        className
      )}>
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold">
            {fallbackText}
          </span>
        )}
      </div>
    </div>
  )
}


