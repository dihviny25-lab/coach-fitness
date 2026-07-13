import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import WorkoutDetail from './pages/WorkoutDetail'
import Measurements from './pages/Measurements'
import Nutrition from './pages/Nutrition'
import Profile from './pages/Profile'

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-16 md:pb-0">
      <NavBar />
      {children}
    </div>
  )
}

function Gate() {
  const { session, profile, profileLoading } = useAuth()

  if (session === undefined || (session && profileLoading)) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm">Carregando...</div>
  }

  if (!session) return <Login />

  const needsOnboarding = !profile?.goal || !profile?.height_cm
  if (needsOnboarding) return <Onboarding />

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/treinos" element={<Workouts />} />
        <Route path="/treinos/:id" element={<WorkoutDetail />} />
        <Route path="/medidas" element={<Measurements />} />
        <Route path="/nutricao" element={<Nutrition />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
