import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      setAuth(data.token, data.user)
      toast.success(`Welcome back, ${data.user.name}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setForm({ email: 'demo@eventceo.ai', password: 'demo1234' })
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 mb-4 animate-glow">
          <Sparkles size={30} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold font-display gradient-text">EventCEO AI</h1>
        <p className="text-slate-400 text-sm mt-1">Plan events with the power of AI</p>
      </div>

      {/* Card */}
      <div className="glass w-full max-w-md p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold text-white font-display mb-6">Sign in to your account</h2>

        {error && (
          <div className="alert-error mb-4 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                className="input pl-9"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="input pl-9 pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full mt-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        {/* Demo shortcut */}
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <p className="text-xs text-purple-300 mb-2 font-medium">🚀 Hackathon Demo Quick Login</p>
          <button onClick={fillDemo} className="btn-sm btn w-full bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 border border-purple-500/30">
            Use Demo Account
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
