import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isConnected: false,

      setUser: (user) =>
        set(() => ({
          user,
          isConnected: !!user
        })),

      setIsConnected: (isConnected) =>
        set(() => ({
          isConnected
        })),

      logout: () =>
        set(() => ({
          user: null,
          isConnected: false
        }))
    }),
    {
      name: 'somix-auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isConnected: state.isConnected 
      })
    }
  )
)


