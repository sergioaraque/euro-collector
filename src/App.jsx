import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CollectionProvider } from './context/CollectionContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import { ToastContainer } from './components/Toast'
import PWABanner from './components/PWABanner'
import { useTranslation } from 'react-i18next'

// Lazy imports — cada página se carga solo cuando se necesita
const LoginPage         = lazy(() => import('./pages/LoginPage'))
const RegisterPage      = lazy(() => import('./pages/RegisterPage'))
const CollectionPage    = lazy(() => import('./pages/CollectionPage'))
const StatsPage         = lazy(() => import('./pages/StatsPage'))
const AdminPage         = lazy(() => import('./pages/AdminPage'))
const AdminCatalogPage  = lazy(() => import('./pages/AdminCatalogPage'))
const MapPage           = lazy(() => import('./pages/MapPage'))
const CoinDetailPage    = lazy(() => import('./pages/CoinDetailPage'))
const ProfilePage       = lazy(() => import('./pages/ProfilePage'))
const ActivityPage      = lazy(() => import('./pages/ActivityPage'))
const RankingPage       = lazy(() => import('./pages/RankingPage'))
const BadgesPage        = lazy(() => import('./pages/BadgesPage'))
const CommunityPage     = lazy(() => import('./pages/CommunityPage'))
const ProgressPage      = lazy(() => import('./pages/ProgressPage'))
const LandingPage       = lazy(() => import('./pages/LandingPage'))
const PublicStatsPage   = lazy(() => import('./pages/public/PublicStatsPage'))
const PublicCatalogPage = lazy(() => import('./pages/public/PublicCatalogPage'))
const PublicRankingPage = lazy(() => import('./pages/public/PublicRankingPage'))
const PublicHeatMapPage = lazy(() => import('./pages/public/PublicHeatMapPage'))
const TermsPage         = lazy(() => import('./pages/public/TermsPage'))

// Spinner de carga entre páginas
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">{t('loading_session')}</p>
      </div>
    </div>
  )

  return user ? children : <Navigate to="/landing" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CollectionProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/mapa" replace />} />
                <Route path="coleccion"      element={<CollectionPage />} />
                <Route path="estadisticas"   element={<StatsPage />} />
                <Route path="admin"          element={<AdminPage />} />
                <Route path="/admin/catalogo" element={<AdminCatalogPage />} />
                <Route path="mapa"           element={<MapPage />} />
                <Route path="moneda/:coinId" element={<CoinDetailPage />} />
                <Route path="perfil"         element={<ProfilePage />} />
                <Route path="progreso"       element={<ProgressPage />} />
                <Route path="insignias"      element={<BadgesPage />} />
                <Route path="actividad"      element={<ActivityPage />} />
                <Route path="ranking"        element={<RankingPage />} />
                <Route path="comunidad"      element={<CommunityPage />} />
              </Route>

              <Route path="/landing"              element={<LandingPage />} />
              <Route path="/mapa-global"          element={<PublicHeatMapPage />} />
              <Route path="/estadisticas-publicas" element={<PublicStatsPage />} />
              <Route path="/catalogo"             element={<PublicCatalogPage />} />
              <Route path="/ranking-publico"      element={<PublicRankingPage />} />
              <Route path="/terminos"             element={<TermsPage />} />
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
          </Suspense>
          <ToastContainer />
          <PWABanner />
        </CollectionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}