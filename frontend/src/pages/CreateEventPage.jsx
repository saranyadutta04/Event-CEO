import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Users, DollarSign, FileText, Sparkles, ArrowRight, ChevronLeft } from 'lucide-react'
import { eventsApi } from '../services/api'
import { EVENT_TYPES, getEventConfig } from '../utils/helpers'
import toast from 'react-hot-toast'

const STEPS = ['Event Type', 'Basic Info', 'Details']

export default function CreateEventPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    type: '',
    title: '',
    date: '',
    endDate: '',
    venue: '',
    city: 'Mumbai',
    description: '',
    guestCount: 100,
    budget: 100000,
    currency: 'INR',
    surpriseMode: false,
    language: 'en',
  })
  const navigate = useNavigate()
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data) => eventsApi.create(data).then(r => r.data),
    onSuccess: (event) => {
      qc.invalidateQueries(['events'])
      toast.success('Event created! 🎉')
      navigate(`/events/${event.id}/ai`)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create event'),
  })

  function update(key, val) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.type) return toast.error('Please select an event type')
    if (!form.title || !form.date || !form.venue) return toast.error('Please fill all required fields')
    createMutation.mutate(form)
  }

  const config = form.type ? getEventConfig(form.type) : null

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/events')} className="btn-icon text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Create New Event</h1>
          <p className="text-slate-400 text-sm">Set up your event details, then get an AI-generated plan</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-white' : 'text-slate-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-purple-600 text-white' :
                'bg-surface-600 text-slate-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-emerald-500' : 'bg-surface-600'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 0: Type Selection */}
        {step === 0 && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-bold text-white font-display mb-4">What type of event are you planning?</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { update('type', key); setStep(1) }}
                  className={`glass p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                    form.type === key ? `border-2 border-opacity-70 shadow-lg` : 'hover:border-white/20'
                  }`}
                  style={form.type === key ? { borderColor: cfg.accent } : {}}
                >
                  <div className="text-4xl mb-3">{cfg.emoji}</div>
                  <div className="font-bold text-white font-display">{cfg.label}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {key === 'wedding' && 'Multi-function ceremonies, mehendi, sangeet'}
                    {key === 'birthday' && 'Surprise mode, party planning, cake & decor'}
                    {key === 'college' && 'Competitions, registrations, certificates'}
                    {key === 'community' && 'Donation tracker, public event page'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="glass p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-white font-display mb-2">
              {config?.emoji} {config?.label} Details
            </h2>

            <div>
              <label className="label">Event Title *</label>
              <input
                type="text"
                className="input"
                placeholder={
                  form.type === 'wedding' ? "Sharma – Kapoor Wedding" :
                  form.type === 'birthday' ? "Priya's 30th Birthday Bash 🎂" :
                  form.type === 'college' ? "TechFest 2027 – IIT Bombay" :
                  "Mumbai Diwali Mela 2027 🪔"
                }
                value={form.title}
                onChange={e => update('title', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Event Date *</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="date" className="input pl-9" value={form.date} onChange={e => update('date', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div>
                <label className="label">End Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="date" className="input pl-9" value={form.endDate} onChange={e => update('endDate', e.target.value)} min={form.date} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Venue *</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" className="input pl-9" placeholder="The Grand Palace Banquet Hall" value={form.venue} onChange={e => update('venue', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="label">City *</label>
              <input type="text" className="input" placeholder="Mumbai" value={form.city} onChange={e => update('city', e.target.value)} required />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1">
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.title || !form.date || !form.venue) return toast.error('Please fill all required fields')
                  setStep(2)
                }}
                className="btn-primary flex-1"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <div className="glass p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-white font-display mb-2">Event Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Expected Guests</label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="number" className="input pl-9" min={1} max={100000} value={form.guestCount} onChange={e => update('guestCount', parseInt(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="label">Total Budget (₹)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="number" className="input pl-9" min={0} value={form.budget} onChange={e => update('budget', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} placeholder="A brief description of your event..." value={form.description} onChange={e => update('description', e.target.value)} />
            </div>

            <div>
              <label className="label">Language</label>
              <select className="select" value={form.language} onChange={e => update('language', e.target.value)}>
                <option value="en">🇬🇧 English</option>
                <option value="hi">🇮🇳 हिंदी</option>
                <option value="bn">🇧🇩 বাংলা</option>
              </select>
            </div>

            {form.type === 'birthday' && (
              <div className="flex items-start gap-3 p-3 glass-sm bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <input
                  type="checkbox"
                  id="surpriseMode"
                  className="mt-0.5 w-4 h-4 accent-orange-500"
                  checked={form.surpriseMode}
                  onChange={e => update('surpriseMode', e.target.checked)}
                />
                <div>
                  <label htmlFor="surpriseMode" className="font-semibold text-orange-300 cursor-pointer flex items-center gap-2">
                    🤫 Enable Surprise Mode
                  </label>
                  <p className="text-xs text-slate-400 mt-1">Hides event details from the birthday person. They see only a generic "you're invited!" page.</p>
                </div>
              </div>
            )}

            <div className="alert-info flex items-start gap-2">
              <Sparkles size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs">After creating, you'll be taken to the <strong>AI Planner</strong> to generate a complete event plan instantly.</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                ← Back
              </button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? 'Creating...' : <>Create & Plan with AI <Sparkles size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
