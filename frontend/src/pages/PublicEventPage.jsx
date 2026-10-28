import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Calendar, MapPin, Users, Heart, X, Check,
  Loader2, Gift, Trophy, Sparkles
} from 'lucide-react'
import { publicApi } from '../services/api'
import { formatDate, getEventConfig } from '../utils/helpers'
import toast from 'react-hot-toast'

const RSVP_OPTIONS = [
  { value: 'yes', label: '✅ Yes, I\'ll be there!', class: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
  { value: 'no', label: '❌ Sorry, can\'t make it', class: 'border-red-500 bg-red-500/10 text-red-300' },
  { value: 'maybe', label: '🤔 Maybe, I\'ll try!', class: 'border-yellow-500 bg-yellow-500/10 text-yellow-300' },
]

function RSVPForm({ token, event }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rsvpStatus: '',
    mealPref: '',
    plusOnes: 0,
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: (data) => publicApi.rsvp(token, data),
    onSuccess: () => {
      setSubmitted(true)
      toast.success('RSVP submitted!')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'RSVP failed'),
  })

  if (submitted) {
    return (
      <div className="text-center py-8 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Heart size={36} className="text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white font-display mb-2">RSVP Received!</h3>
        <p className="text-slate-400">Thank you for your response. We look forward to seeing you!</p>
        {form.rsvpStatus === 'yes' && (
          <div className="mt-4 glass-sm p-4 text-sm text-slate-300">
            🎉 Get ready for an amazing time at <strong className="text-white">{event.title}</strong>!
          </div>
        )}
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Please enter your name')
    if (!form.rsvpStatus) return toast.error('Please select your RSVP response')
    mutation.mutate({ ...form, plusOnes: Number(form.plusOnes) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Your Name *</label>
        <input
          className="input"
          placeholder="Full name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            placeholder="+91 9876543210"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Will you attend? *</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RSVP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, rsvpStatus: opt.value }))}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                form.rsvpStatus === opt.value
                  ? opt.class
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {form.rsvpStatus === 'yes' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Meal Preference</label>
              <select
                className="select"
                value={form.mealPref}
                onChange={e => setForm(f => ({ ...f, mealPref: e.target.value }))}
              >
                <option value="">Not specified</option>
                <option value="veg">🥗 Vegetarian</option>
                <option value="non-veg">🍗 Non-Vegetarian</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="jain">🙏 Jain</option>
              </select>
            </div>
            <div>
              <label className="label">Plus Ones</label>
              <input
                className="input"
                type="number"
                min="0"
                max="5"
                value={form.plusOnes}
                onChange={e => setForm(f => ({ ...f, plusOnes: e.target.value }))}
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="label">Message (optional)</label>
        <textarea
          className="textarea"
          rows={2}
          placeholder="Leave a warm message for the host..."
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary btn-lg w-full"
      >
        {mutation.isPending ? (
          <><Loader2 size={18} className="animate-spin" /> Submitting…</>
        ) : (
          <><Heart size={18} /> Submit RSVP</>
        )}
      </button>
    </form>
  )
}

function DonationForm({ token }) {
  const [form, setForm] = useState({ donorName: '', amount: '', message: '', isAnonymous: false })
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: (data) => publicApi.donate(token, data),
    onSuccess: () => { setDone(true); toast.success('Thank you for your donation!') },
    onError: (err) => toast.error(err.response?.data?.error || 'Donation failed'),
  })

  if (done) {
    return (
      <div className="text-center py-6 animate-scale-in">
        <div className="text-4xl mb-3">💝</div>
        <h3 className="font-bold text-white font-display text-lg">Thank you!</h3>
        <p className="text-slate-400 text-sm">Your contribution means a lot to us.</p>
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.isAnonymous && !form.donorName.trim()) return toast.error('Please enter your name')
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Please enter a valid amount')
    mutation.mutate({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <input
          type="checkbox"
          id="anon"
          checked={form.isAnonymous}
          onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
          className="w-4 h-4 rounded accent-purple-500"
        />
        <label htmlFor="anon" className="text-sm text-slate-300">Donate anonymously</label>
      </div>
      {!form.isAnonymous && (
        <div>
          <label className="label">Your Name *</label>
          <input
            className="input"
            value={form.donorName}
            onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))}
            placeholder="Full name"
          />
        </div>
      )}
      <div>
        <label className="label">Amount (₹) *</label>
        <input
          className="input"
          type="number"
          min="1"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          placeholder="e.g. 500"
        />
        <div className="flex gap-2 mt-2">
          {[100, 500, 1000, 2000].map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setForm(f => ({ ...f, amount: a.toString() }))}
              className="btn-secondary btn-sm"
            >
              ₹{a}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Message (optional)</label>
        <textarea
          className="textarea"
          rows={2}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="A warm message..."
        />
      </div>
      <button type="submit" disabled={mutation.isPending} className="btn-primary btn-lg w-full">
        {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
        Donate Now
      </button>
    </form>
  )
}

export default function PublicEventPage() {
  const { token } = useParams()
  const [tab, setTab] = useState('rsvp')

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['public-event', token],
    queryFn: () => publicApi.getEvent(token).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center p-4">
        <div className="glass p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white font-display mb-2">Event Not Found</h2>
          <p className="text-slate-400 text-sm">This event link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  const config = getEventConfig(event.type)

  const tabs = [
    { id: 'rsvp', label: '💌 RSVP' },
    ...(event.type === 'community' ? [{ id: 'donate', label: '💝 Donate' }] : []),
    ...(event.competitions?.length > 0 ? [{ id: 'compete', label: '🏆 Competitions' }] : []),
  ]

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className={`glass p-8 mb-6 bg-gradient-to-br ${config.bg} text-center animate-fade-in`}
          style={{ borderTop: `4px solid ${config.accent}` }}>
          <div className="text-5xl mb-4">{config.emoji}</div>
          <h1 className="text-3xl font-bold text-white font-display mb-3">{event.title}</h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-300 mb-4">
            <span className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-slate-400" />
              {event.venue}, {event.city}
            </span>
            <span className="flex items-center gap-2">
              <Users size={15} className="text-slate-400" />
              {event.guestCount} guests expected
            </span>
          </div>

          {event.surpriseMode ? (
            <div className="alert-warning text-xs mt-2">
              🤫 Surprise event! Please keep this a secret.
            </div>
          ) : event.description ? (
            <p className="text-slate-300 text-sm leading-relaxed">{event.description}</p>
          ) : null}
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="tab-bar mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={tab === t.id ? 'tab-item-active' : 'tab-item'}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="glass p-6 animate-fade-in">
          {tab === 'rsvp' && (
            <>
              <h2 className="text-xl font-bold text-white font-display mb-6 flex items-center gap-2">
                <Heart size={20} className="text-rose-400" /> RSVP
              </h2>
              <RSVPForm token={token} event={event} />
            </>
          )}

          {tab === 'donate' && (
            <>
              <h2 className="text-xl font-bold text-white font-display mb-2 flex items-center gap-2">
                <Gift size={20} className="text-emerald-400" /> Support the Cause
              </h2>
              {event.stats?.totalDonations > 0 && (
                <div className="glass-sm p-3 mb-4 text-center">
                  <span className="text-emerald-400 font-bold">₹{event.stats.totalDonations.toLocaleString('en-IN')}</span>
                  <span className="text-slate-400 text-sm"> raised so far from </span>
                  <span className="text-white font-semibold">{event.donations?.length || 0} donors</span>
                </div>
              )}
              <DonationForm token={token} />
            </>
          )}

          {tab === 'compete' && (
            <>
              <h2 className="text-xl font-bold text-white font-display mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-400" /> Competitions
              </h2>
              <div className="space-y-4">
                {(event.competitions || []).map(comp => (
                  <div key={comp.id} className="glass-sm p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-bold text-white">{comp.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{comp.registrations?.length || 0} teams registered</div>
                      </div>
                      <span className="badge badge-blue">{comp.category}</span>
                    </div>
                    {comp.description && <p className="text-sm text-slate-400 mb-3">{comp.description}</p>}
                    {comp.prize && <div className="text-sm text-yellow-400 mb-3">🏆 Prize: {comp.prize}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-600">
          Powered by <span className="text-purple-400 font-semibold">EventCEO AI</span> ✨
        </div>
      </div>
    </div>
  )
}
