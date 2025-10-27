import { useState } from 'react'
import { Bell, Heart, MessageCircle, Coins, UserPlus, Award, Settings, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../components/Button.jsx'
import { useNotifications } from '../../hooks/useNotifications.js'

export function Notifications() {
  const [activeTab, setActiveTab] = useState('all')
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications()

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'likes', label: 'Likes', count: notifications.filter(n => n.type === 'like').length },
    { id: 'mints', label: 'Mints', count: notifications.filter(n => n.type === 'mint').length },
    { id: 'follows', label: 'Follows', count: notifications.filter(n => n.type === 'follow').length },
  ]

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-400" />
      case 'mint':
        return <Coins className="w-5 h-5 text-green-400" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-400" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-purple-400" />
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-400" />
      default:
        return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const markAsReadHandler = async (id) => {
    await markAsRead(id)
  }

  const markAllAsReadHandler = async () => {
    await markAllAsRead()
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    fetchNotifications({ type: tabId })
  }

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notif.read
    return notif.type === activeTab.slice(0, -1) // Remove 's' from plural
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Notifications</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsReadHandler}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-6">
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-2xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                'flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Bell className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Loading...</h2>
            <p className="text-gray-300 text-lg">Fetching your notifications</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <X className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-300 text-lg mb-8">{error}</p>
            <Button onClick={() => fetchNotifications()}>
              Try Again
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
              <Bell className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">No Notifications</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
              {activeTab === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You'll see notifications about likes, mints, follows, and more here."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={clsx(
                  'glass-effect rounded-2xl p-4 hover:scale-[1.01] transition-all duration-300 cursor-pointer',
                  !notification.read && 'ring-2 ring-purple-500/30'
                )}
                onClick={() => markAsReadHandler(notification._id)}
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="relative">
                    {notification.senderAvatar ? (
                      <img
                        src={notification.senderAvatar}
                        alt={notification.senderUsername}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          <span className="font-semibold">{notification.senderUsername}</span>{' '}
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        )}
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}