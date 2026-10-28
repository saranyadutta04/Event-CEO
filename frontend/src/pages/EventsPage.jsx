import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { useState } from 'react'
import { eventsApi } from '../services/api'
import EventCard from '../components/EventCard'
import { EVENT_TYPES } from '../utils/helpers'

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then(r => r.data)
  })

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || e.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-display text-white">My Events</h1>
        <Link to="/events/new" className="btn-primary">
          <Plus size={18} /> New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tab-bar no-scrollbar">
          {['all', 'wedding', 'birthday', 'college', 'community'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={typeFilter === type ? 'tab-item-active' : 'tab-item'}
            >
              {type === 'all' ? '🌟 All' : `${EVENT_TYPES[type].emoji} ${EVENT_TYPES[type].label}`}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass">
          <div className="text-5xl mb-4 animate-float">📅</div>
          <h3 className="text-lg font-bold text-white font-display mb-2">
            {search || typeFilter !== 'all' ? 'No events match your filter' : 'No events yet'}
          </h3>
          <p className="text-slate-400 mb-6">
            {search || typeFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first event to get started!'}
          </p>
          {!search && typeFilter === 'all' && (
            <Link to="/events/new" className="btn-primary btn-lg">
              <Plus size={18} /> Create Event
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-500 mb-4">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </>
      )}
    </div>
  )
}
