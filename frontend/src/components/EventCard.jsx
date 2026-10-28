import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { formatINR, formatDate, daysUntil, getEventConfig, RSVP_CONFIG } from '../utils/helpers'

export default function EventCard({ event }) {
  const config = getEventConfig(event.type)
  const days = daysUntil(event.date)
  const isPast = days < 0

  return (
    <Link
      to={`/events/${event.id}`}
      className={`glass block p-5 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30 group border-l-4`}
      style={{ borderLeftColor: config.accent }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.emoji}</span>
          <span className="badge badge-gray text-xs">{config.label}</span>
        </div>
        {isPast ? (
          <span className="badge badge-gray">Completed</span>
        ) : days === 0 ? (
          <span className="badge badge-green animate-pulse">Today! 🎉</span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">{days}d left</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-white font-display text-base mb-2 line-clamp-2 group-hover:text-purple-200 transition-colors">
        {event.title}
      </h3>

      {/* Meta */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar size={13} className="flex-shrink-0" />
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin size={13} className="flex-shrink-0" />
          <span className="truncate">{event.venue}, {event.city}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users size={13} className="flex-shrink-0" />
          <span>{event.stats?.totalGuests || 0} / {event.guestCount} guests</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 text-xs">
        <div className="flex-1">
          <div className="text-slate-500 mb-1">RSVP</div>
          <div className="progress-bar h-1.5">
            <div
              className="progress-fill bg-emerald-500"
              style={{ width: `${event.stats?.totalGuests ? (event.stats.rsvpYes / event.stats.totalGuests * 100) : 0}%` }}
            />
          </div>
          <div className="text-slate-400 mt-0.5">{event.stats?.rsvpYes || 0} going</div>
        </div>
        <div className="flex-1">
          <div className="text-slate-500 mb-1">Tasks</div>
          <div className="progress-bar h-1.5">
            <div
              className="progress-fill bg-blue-500"
              style={{ width: `${event.stats?.tasksTotal ? (event.stats.tasksDone / event.stats.tasksTotal * 100) : 0}%` }}
            />
          </div>
          <div className="text-slate-400 mt-0.5">{event.stats?.tasksDone || 0}/{event.stats?.tasksTotal || 0}</div>
        </div>
        <div className="flex-1">
          <div className="text-slate-500 mb-1">Budget</div>
          <div className="text-slate-300 font-medium mt-1">{formatINR(event.budget)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between">
        <span className="text-xs text-slate-500">{formatINR(event.stats?.budgetActual || 0)} spent</span>
        <span className="text-xs text-purple-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  )
}
