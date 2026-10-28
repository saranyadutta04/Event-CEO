import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Users, CheckSquare, TrendingUp, Sparkles, Clock, ArrowRight } from 'lucide-react'
import { eventsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatINR, formatDate, daysUntil, getEventConfig } from '../utils/helpers'
import EventCard from '../components/EventCard'

function StatCard({ icon: Icon, label, value, sub, color = 'purple' }) {
  const colors = {
    purple: 'from-purple-600/20 to-violet-600/10 border-purple-500/20 text-purple-400',
    green: 'from-emerald-600/20 to-green-600/10 border-emerald-500/20 text-emerald-400',
    blue: 'from-blue-600/20 to-cyan-600/10 border-blue-500/20 text-blue-400',
    orange: 'from-orange-600/20 to-amber-600/10 border-orange-500/20 text-orange-400',
  }
  return (
    <div className={`glass-sm bg-gradient-to-br ${colors[color]} p-4 flex items-start gap-3`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors[color]} flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white font-display">{value}</div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then(r => r.data)
  })

  const upcoming = events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const past = events.filter(e => new Date(e.date) < new Date())
  const nextEvent = upcoming[0]

  const totalGuests = events.reduce((s, e) => s + (e.stats?.totalGuests || 0), 0)
  const totalBudget = events.reduce((s, e) => s + (e.budget || 0), 0)
  const totalTasks = events.reduce((s, e) => s + (e.stats?.tasksTotal || 0), 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-white mb-1">
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-400">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming event${upcoming.length > 1 ? 's' : ''}`
              : 'No upcoming events. Create your first event!'}
          </p>
        </div>
        <Link to="/events/new" className="btn-primary btn-lg flex-shrink-0">
          <Plus size={20} />
          New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar} label="Total Events" value={events.length} sub={`${upcoming.length} upcoming`} color="purple" />
        <StatCard icon={Users} label="Total Guests" value={totalGuests.toLocaleString()} color="blue" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={totalTasks} color="green" />
        <StatCard icon={TrendingUp} label="Total Budget" value={formatINR(totalBudget)} color="orange" />
      </div>

      {/* Next upcoming event highlight */}
      {nextEvent && (
        <div className={`mb-8 glass p-6 bg-gradient-to-br ${getEventConfig(nextEvent.type).bg} border border-white/10 animate-slide-up`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getEventConfig(nextEvent.type).emoji}</span>
                <span className="badge-purple text-xs">Next Event</span>
              </div>
              <h2 className="text-xl font-bold text-white font-display mb-1">{nextEvent.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(nextEvent.date)}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} />
                  {daysUntil(nextEvent.date) > 0 ? `${daysUntil(nextEvent.date)} days left` : 'Today!'}
                </span>
                <span className="flex items-center gap-1.5"><Users size={14} />{nextEvent.stats?.totalGuests || 0} guests</span>
              </div>
            </div>
            <Link to={`/events/${nextEvent.id}`} className="btn-primary flex-shrink-0">
              Manage <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mini progress */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">RSVP</div>
              <div className="progress-bar">
                <div className="progress-fill bg-emerald-500"
                  style={{ width: `${nextEvent.stats?.totalGuests ? (nextEvent.stats.rsvpYes / nextEvent.stats.totalGuests * 100) : 0}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1">{nextEvent.stats?.rsvpYes || 0} confirmed</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Tasks</div>
              <div className="progress-bar">
                <div className="progress-fill bg-blue-500"
                  style={{ width: `${nextEvent.stats?.tasksTotal ? (nextEvent.stats.tasksDone / nextEvent.stats.tasksTotal * 100) : 0}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1">{nextEvent.stats?.tasksDone || 0}/{nextEvent.stats?.tasksTotal || 0} done</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Budget Used</div>
              <div className="progress-bar">
                <div className="progress-fill bg-amber-500"
                  style={{ width: `${nextEvent.stats?.budgetEstimated ? Math.min((nextEvent.stats.budgetActual / nextEvent.stats.budgetEstimated * 100), 100) : 0}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1">{formatINR(nextEvent.stats?.budgetActual || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="section-header">
        <h2 className="section-title">All Events</h2>
        <Link to="/events" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state glass">
          <div className="text-6xl mb-4 animate-float">🎉</div>
          <h3 className="text-xl font-bold text-white font-display mb-2">No events yet</h3>
          <p className="text-slate-400 mb-6 max-w-xs">Create your first event and let AI generate a complete plan in under 2 minutes!</p>
          <Link to="/events/new" className="btn-primary btn-lg">
            <Plus size={20} /> Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 6).map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}

      {/* AI prompt card */}
      <div className="mt-8 glass p-6 bg-gradient-to-r from-purple-900/40 to-violet-900/30 border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white font-display">EventCEO AI Planner</h3>
            <p className="text-xs text-slate-400">Go from idea to full plan in under 2 minutes</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          Select any event and click "AI Plan" to generate a personalized checklist, budget breakdown, 
          vendor list, day-of timeline, and 3 theme ideas — instantly.
        </p>
        {upcoming.length > 0 ? (
          <Link to={`/events/${upcoming[0].id}/ai`} className="btn-primary">
            <Sparkles size={16} /> Generate AI Plan for {upcoming[0].title}
          </Link>
        ) : (
          <Link to="/events/new" className="btn-primary">
            <Plus size={16} /> Create an event first
          </Link>
        )}
      </div>
    </div>
  )
}
