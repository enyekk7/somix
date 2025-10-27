import { BottomTabs } from './BottomTabs.jsx'
import { useAutoRegister } from '../hooks/useAutoRegister.js'
import { useAutoConnect } from '../hooks/useAutoConnect.js'

export function AppLayout({ children }) {
  // Auto-connect wallet on page load
  useAutoConnect()
  
  // Auto-register user when wallet connects
  useAutoRegister()

  return (
    <div className="min-h-screen bg-black">
      {/* Main content */}
      <main className="pb-20">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <BottomTabs />
    </div>
  )
}


