import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User 
} from 'lucide-react'
import { clsx } from 'clsx'
import { useNotifications } from '../../hooks/useNotifications.js'
import { useAccount } from 'wagmi'

const tabs = [
  { path: '/', icon: Home, label: 'Home', requiresAuth: false },
  { path: '/search', icon: Search, label: 'Search', requiresAuth: true },
  { path: '/post', icon: Plus, label: 'Create', requiresAuth: true },
  { path: '/notifications', icon: Bell, label: 'Notifications', requiresAuth: true },
  { path: '/profile', icon: User, label: 'Profile', requiresAuth: true },
]

export function BottomTabs() {
  const location = useLocation()
  const { unreadCount } = useNotifications()
  const { isConnected } = useAccount()

  // Debug logging
  console.log('🔔 BottomTabs unreadCount:', unreadCount)
  console.log('🔗 BottomTabs isConnected:', isConnected)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="flex items-center justify-around py-3 px-2">
        {tabs.map(({ path, icon: Icon, label, requiresAuth }) => {
          const isActive = location.pathname === path
          const isNotificationTab = path === '/notifications'
          const isDisabled = requiresAuth && !isConnected
          
          return (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 relative group',
                isActive
                  ? 'text-white bg-white/10'
                  : isDisabled
                  ? 'text-gray-600 cursor-not-allowed opacity-50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <div className={clsx(
                'relative p-2 rounded-xl transition-all duration-300',
                isActive && 'bg-white/20'
              )}>
                <Icon 
                  size={20} 
                  className={clsx(
                    'transition-all duration-300',
                    isActive ? 'text-white' : isDisabled ? 'text-gray-600' : 'text-gray-400 group-hover:text-white'
                  )}
                />
                {isNotificationTab && unreadCount > 0 && isConnected && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <span className={clsx(
                'text-xs font-medium mt-1 transition-all duration-300',
                isActive ? 'text-white' : isDisabled ? 'text-gray-600' : 'text-gray-400 group-hover:text-white'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

