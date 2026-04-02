import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MapPage } from './pages/MapPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { RoutePage } from './pages/RoutePage'
import { AdminPage } from './pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/map" element={<MapPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/route" element={<RoutePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
