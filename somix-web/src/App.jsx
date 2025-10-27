import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './app/layout/AppLayout.jsx'
import { Home } from './app/routes/Home.jsx'
import { PostWizard } from './app/routes/PostWizard.jsx'
import { Search } from './app/routes/Search.jsx'
import { Profile } from './app/routes/Profile.jsx'
import { Notifications } from './app/routes/Notifications.jsx'
import { Agent } from './app/routes/Agent.jsx'
import { Game } from './app/routes/Game.jsx'
import { SomixPro } from './app/routes/SomixPro.jsx'
import { Mission } from './app/routes/Mission.jsx'
import { TopUp } from './app/routes/TopUp.jsx'
import { ProtectedRoute } from './app/components/LoginPage.jsx'

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post" element={<ProtectedRoute><PostWizard /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:address" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><Agent /></ProtectedRoute>} />
          <Route path="/topcreators" element={<ProtectedRoute><Game /></ProtectedRoute>} />
          <Route path="/somixpro" element={<ProtectedRoute><SomixPro /></ProtectedRoute>} />
          <Route path="/mission" element={<ProtectedRoute><Mission /></ProtectedRoute>} />
          <Route path="/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
        </Routes>
      </AppLayout>
    </div>
  )
}

export default App


