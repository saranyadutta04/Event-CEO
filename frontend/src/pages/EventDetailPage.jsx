import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, MapPin, Users, DollarSign, CheckSquare, QrCode,
  Sparkles, ExternalLink, Share2, Trash2, Edit, Clock,
  TrendingUp, HeartHandshake, Trophy
} from 'lucide-react'
import { eventsApi } from '../services/api'
import { formatINR, formatDate, daysUntil, getEventConfig, RSVP_CONFIG } from '../utils/helpers'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="glass-sm p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
        <Icon size={14} /> {label}
      </div>
      <div className="text-2xl font-bold text-white font-display" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id).then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['events'])
      toast.success('Event deleted')
      navigate('/events')
    },
    onError: () => toast.error('Failed to delete event'),
  })

  if (isLoading) return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  if (error || !event) return (
    <div className="page-container">
      <div className="empty-state glass">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-lg font-bold text-white">Event not found</h2>
        <Link to="/events" className="btn-primary mt-4">Back to Events</Link>
      </div>
    </div>
  )

  const config = getEventConfig(event.type)
  const days = daysUntil(event.date)
  const publicUrl = `${window.location.origin}/event/${event.publicToken}`

  // Budget chart data
  const budgetByCategory = {}
  ;(event.budgetItems || []).forEach(b => {
    budgetByCategory[b.category] = (budgetByCategory[b.category] || 0) + b.estimated
  })
  const budgetChartData = Object.entries(budgetByCategory).map(([name, value]) => ({ name, value }))

  function handleDelete() {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    deleteMutation.mutate()
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`You're invited to *${event.title}*!\n📅 ${formatDate(event.date)}\n📍 ${event.venue}\n\nRSVP here: ${publicUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Hero */}
      <div className={`glass p-6 mb-6 bg-gradient-to-br ${config.bg} border-l-4`} style={{ borderLeftColor: config.accent }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-3xl">{config.emoji}</span>
              <span className="badge badge-purple">{config.label}</span>
              {event.surpriseMode && <span className="badge badge-yellow">🤫 Surprise Mode</span>}
              {days === 0 && <span className="badge badge-green animate-pulse">Today!</span>}
              {days < 0 && <span className="badge badge-gray">Completed</span>}
            </div>
            <h1 className="text-2xl font-bold text-white font-display mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}, {event.city}</span>
              {days > 0 && <span className="flex items-center gap-1.5"><Clock size={14} />{days} days left</span>}
            </div>
            {event.description && <p className="text-sm text-slate-400 mt-2 max-w-2xl">{event.description}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={shareWhatsApp} className="btn-secondary btn-sm">
              <Share2 size={14} /> WhatsApp
            </button>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
              <ExternalLink size={14} /> Public Page
            </a>
            <Link to={`/events/${id}/ai`} className="btn-primary btn-sm">
              <Sparkles size={14} /> AI Plan
            </Link>
            <button onClick={handleDelete} className="btn-danger btn-sm">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Guests" value={event.stats?.totalGuests || 0}
          sub={`${event.stats?.rsvpYes || 0} confirmed`} accent="#10b981" />
        <StatCard icon={CheckSquare} label="Tasks Done" value={`${event.stats?.tasksDone || 0}/${event.stats?.tasksTotal || 0}`}
          sub="checklist progress" accent="#3b82f6" />
        <StatCard icon={DollarSign} label="Budget Used" value={formatINR(event.stats?.budgetActual || 0)}
          sub={`of ${formatINR(event.stats?.budgetEstimated || event.budget)}`} accent="#f59e0b" />
        <StatCard icon={QrCode} label="Checked In" value={event.stats?.checkedIn || 0}
          sub={`of ${event.stats?.rsvpYes || 0} expected`} accent="#8b5cf6" />
      </div>

      {/* Navigation tabs */}
      <div className="tab-bar mb-6 no-scrollbar">
        {[
          { to: `/events/${id}`, label: '📊 Overview', exact: true },
          { to: `/events/${id}/guests`, label: '👥 Guests' },
          { to: `/events/${id}/tasks`, label: '✅ Tasks' },
          { to: `/events/${id}/budget`, label: '💰 Budget' },
          { to: `/checkin/${id}`, label: '📲 Check-in' },
          { to: `/events/${id}/ai`, label: '🤖 AI Planner' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} className={location.pathname === to ? 'tab-item-active' : 'tab-item'}>
            {label}
          </Link>
        ))}
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSVP breakdown */}
        <div className="glass p-5">
          <h3 className="section-title mb-4">RSVP Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(RSVP_CONFIG).map(([key, cfg]) => {
              const count = event.stats?.[`rsvp${key.charAt(0).toUpperCase() + key.slice(1)}`] || 0
              const total = event.stats?.totalGuests || 1
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-sm text-slate-300 w-24">{cfg.label}</span>
                  <div className="flex-1 progress-bar">
                    <div className={`progress-fill ${cfg.dot.replace('bg-', 'bg-')}`}
                      style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-white w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
          <Link to={`/events/${id}/guests`} className="btn-secondary btn-sm mt-4 w-full justify-center">
            Manage Guests →
          </Link>
        </div>

        {/* Budget donut */}
        <div className="glass p-5">
          <h3 className="section-title mb-4">Budget Overview</h3>
          {budgetChartData.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={budgetChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      paddingAngle={3} dataKey="value">
                      {budgetChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatINR(v)}
                      contentStyle={{ background: '#1a1a27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {budgetChartData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <DollarSign size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No budget items yet</p>
              <Link to={`/events/${id}/budget`} className="btn-secondary btn-sm mt-3">Add Items</Link>
            </div>
          )}
          {(event.stats?.budgetActual > event.stats?.budgetEstimated) && (
            <div className="alert-warning mt-3 text-xs">⚠️ Over budget by {formatINR(event.stats.budgetActual - event.stats.budgetEstimated)}</div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="glass p-5">
          <div className="section-header">
            <h3 className="section-title">Recent Tasks</h3>
            <Link to={`/events/${id}/tasks`} className="text-xs text-purple-400">View all →</Link>
          </div>
          {(event.tasks || []).slice(0, 5).length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No tasks yet. <Link to={`/events/${id}/ai`} className="text-purple-400">Generate with AI →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(event.tasks || []).slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'done' ? 'bg-emerald-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' :
                    task.status === 'blocked' ? 'bg-red-500' : 'bg-slate-500'
                  }`} />
                  <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {task.title}
                  </span>
                  {task.priority === 'urgent' && <span className="badge badge-red text-xs">!</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wedding functions / Donations / Competitions */}
        {event.type === 'wedding' && (
          <div className="glass p-5">
            <h3 className="section-title mb-4">Event Functions</h3>
            {(event.functions || []).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No functions added yet</p>
            ) : (
              <div className="space-y-3">
                {(event.functions || []).map(fn => (
                  <div key={fn.id} className="flex items-center gap-3 py-2 border-b border-white/8 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">{fn.order}</div>
                    <div>
                      <div className="font-semibold text-white text-sm">{fn.name}</div>
                      <div className="text-xs text-slate-500">{formatDate(fn.date)} · {fn.venue || event.venue}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {event.type === 'community' && (
          <div className="glass p-5">
            <div className="section-header">
              <h3 className="section-title">💝 Donations</h3>
              <span className="badge badge-green">Total: {formatINR(event.stats?.totalDonations || 0)}</span>
            </div>
            {(event.donations || []).slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs flex-shrink-0">
                  {d.isAnonymous ? '?' : d.donorName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{d.isAnonymous ? 'Anonymous' : d.donorName}</div>
                  {d.message && <div className="text-xs text-slate-500 truncate">{d.message}</div>}
                </div>
                <span className="text-emerald-400 font-bold text-sm">{formatINR(d.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {event.type === 'college' && (
          <div className="glass p-5">
            <h3 className="section-title mb-4">🏆 Competitions</h3>
            {(event.competitions || []).map(comp => (
              <div key={comp.id} className="glass-sm p-3 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">{comp.name}</div>
                    <div className="text-xs text-slate-400">{comp.registrations?.length || 0} teams registered</div>
                  </div>
                  <span className="badge badge-blue">{comp.category}</span>
                </div>
                {comp.prize && <div className="text-xs text-yellow-400 mt-1">🏆 {comp.prize}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
