import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import CreateEventPage from './pages/CreateEventPage'
import GuestsPage from './pages/GuestsPage'
import TasksPage from './pages/TasksPage'
import BudgetPage from './pages/BudgetPage'
import CheckInPage from './pages/CheckInPage'
import PublicEventPage from './pages/PublicEventPage'
import AIPlannerPage from './pages/AIPlannerPage'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/event/:token" element={<PublicEventPage />} />

      {/* Private routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<CreateEventPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="events/:id/guests" element={<GuestsPage />} />
        <Route path="events/:id/tasks" element={<TasksPage />} />
        <Route path="events/:id/budget" element={<BudgetPage />} />
        <Route path="events/:id/ai" element={<AIPlannerPage />} />
        <Route path="checkin/:id" element={<CheckInPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
