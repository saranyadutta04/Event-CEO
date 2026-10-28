import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles, Loader2, ChevronLeft, Check, X, RefreshCw,
  ListChecks, DollarSign, Calendar, Lightbulb, Clock,
  ChevronDown, ChevronUp, AlertTriangle, Zap
} from 'lucide-react'
import { aiApi, eventsApi } from '../services/api'
import { formatINR } from '../utils/helpers'
import toast from 'react-hot-toast'

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
      >
        <h3 className="font-bold text-white font-display flex items-center gap-2">
          <Icon size={18} className="text-purple-400" />
          {title}
        </h3>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function PlanView({ plan, planId, eventId, applied }) {
  const qc = useQueryClient()
  const [applying, setApplying] = useState(false)

  const applyMutation = useMutation({
    mutationFn: () => aiApi.applyPlan(planId),
    onSuccess: (res) => {
      setApplying(false)
      qc.invalidateQueries(['event', eventId])
      qc.invalidateQueries(['tasks', eventId])
      qc.invalidateQueries(['budget', eventId])
      toast.success(`✅ Applied! ${res.data.tasksCreated} tasks + ${res.data.budgetItemsCreated} budget items created.`)
    },
    onError: (err) => {
      setApplying(false)
      toast.error(err.response?.data?.error || 'Failed to apply plan')
    },
  })

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Apply banner */}
      {!applied && (
        <div className="glass p-4 bg-gradient-to-r from-purple-900/40 to-violet-900/30 border-purple-500/20 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              Apply this plan to your event
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Creates all tasks & budget items automatically. This cannot be undone.
            </div>
          </div>
          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="btn-primary"
          >
            {applyMutation.isPending
              ? <><Loader2 size={16} className="animate-spin" /> Applying…</>
              : <><Check size={16} /> Apply Plan</>}
          </button>
        </div>
      )}
      {applied && (
        <div className="glass-sm p-4 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-3">
          <Check size={18} className="text-emerald-400" />
          <span className="text-emerald-300 font-medium">Plan has been applied to your event!</span>
        </div>
      )}

      {/* Theme Ideas */}
      {plan.themes && plan.themes.length > 0 && (
        <Section title="Theme Ideas" icon={Lightbulb}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.themes.map((theme, i) => (
              <div key={i} className="glass-sm p-4">
                <div className="font-bold text-white mb-2">Option {i + 1}: {theme.name}</div>
                <p className="text-sm text-slate-400 mb-3">{theme.description}</p>
                {theme.colors && (
                  <div className="flex gap-1.5 flex-wrap">
                    {theme.colors.map((c, ci) => (
                      <span key={ci} className="text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tasks */}
      {plan.tasks && plan.tasks.length > 0 && (
        <Section title={`Task Checklist (${plan.tasks.length} tasks)`} icon={ListChecks}>
          <div className="space-y-2">
            {plan.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{task.title}</div>
                  <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                    {task.category && <span className="badge badge-gray">{task.category}</span>}
                    {task.daysBeforeEvent !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {task.daysBeforeEvent} days before
                      </span>
                    )}
                    {task.priority && <span className={`badge ${task.priority === 'urgent' ? 'badge-red' : task.priority === 'high' ? 'badge-yellow' : 'badge-gray'}`}>{task.priority}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Budget */}
      {plan.budgetBreakdown && plan.budgetBreakdown.length > 0 && (
        <Section title="Budget Breakdown" icon={DollarSign}>
          <div className="space-y-2 mb-4">
            {plan.budgetBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-white">{item.name}</div>
                  {item.category && <span className="badge badge-gray mt-0.5">{item.category}</span>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{formatINR(item.estimated)}</div>
                  {item.notes && <div className="text-xs text-slate-500">{item.notes}</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="glass-sm p-3 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Total Estimated</span>
            <span className="font-bold text-xl text-white">
              {formatINR(plan.budgetBreakdown.reduce((s, i) => s + (i.estimated || 0), 0))}
            </span>
          </div>
        </Section>
      )}

      {/* Day-of Timeline */}
      {plan.timeline && plan.timeline.length > 0 && (
        <Section title="Day-of Timeline" icon={Calendar}>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-purple-500/20" />
            <div className="space-y-4">
              {plan.timeline.map((item, i) => (
                <div key={i} className="flex gap-4 relative pl-10">
                  <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-purple-500 border-2 border-surface-900" />
                  <div>
                    <div className="text-xs text-purple-400 font-bold mb-0.5">{item.time}</div>
                    <div className="text-sm text-white font-medium">{item.activity}</div>
                    {item.notes && <div className="text-xs text-slate-500 mt-0.5">{item.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Vendor Suggestions */}
      {plan.vendors && plan.vendors.length > 0 && (
        <Section title="Vendor Suggestions" icon={Sparkles}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.vendors.map((v, i) => (
              <div key={i} className="glass-sm p-4">
                <div className="font-semibold text-white text-sm mb-1">{v.category}</div>
                <p className="text-xs text-slate-400">{v.suggestions || v.tip}</p>
                {v.budget && <div className="text-xs text-emerald-400 mt-1">💰 Budget: {v.budget}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tips */}
      {plan.tips && plan.tips.length > 0 && (
        <Section title="Pro Tips" icon={Lightbulb} defaultOpen={false}>
          <ul className="space-y-2">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-yellow-400 mt-0.5">💡</span>
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

export default function AIPlannerPage() {
  const { id: eventId } = useParams()
  const [preferences, setPreferences] = useState('')
  const [activePlanId, setActivePlanId] = useState(null)
  const [generating, setGenerating] = useState(false)

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId).then(r => r.data),
  })

  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ['ai-plans', eventId],
    queryFn: () => aiApi.listPlans(eventId).then(r => r.data),
  })

  const { data: activePlan } = useQuery({
    queryKey: ['ai-plan-detail', activePlanId],
    queryFn: () => aiApi.getPlan(activePlanId).then(r => r.data),
    enabled: !!activePlanId,
  })

  const generateMutation = useMutation({
    mutationFn: () => aiApi.generatePlan({ eventId, preferences }),
    onSuccess: (res) => {
      setGenerating(false)
      setActivePlanId(res.data.id)
      refetchPlans()
      if (res.data.warning) {
        toast(`⚠️ ${res.data.warning}`, { duration: 5000 })
      } else {
        toast.success('🤖 AI plan generated!')
      }
    },
    onError: (err) => {
      setGenerating(false)
      toast.error(err.response?.data?.error || 'AI generation failed')
    },
  })

  function handleGenerate() {
    setGenerating(true)
    setActivePlanId(null)
    generateMutation.mutate()
  }

  // Load latest plan on first visit
  const latestPlan = plans[0]

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/events/${eventId}`} className="btn-icon text-slate-400">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Sparkles className="text-purple-400" size={22} />
            AI Event Planner
          </h1>
          <p className="text-sm text-slate-400">Generate a complete plan in seconds</p>
        </div>
      </div>

      {/* Generate Card */}
      <div className="glass p-6 mb-6 bg-gradient-to-br from-purple-900/40 to-violet-900/30 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white font-display">Generate AI Plan</h2>
            <p className="text-xs text-slate-400">
              {event ? `${event.type} · ${event.guestCount} guests · ₹${(event.budget / 100000).toFixed(1)}L budget` : 'Loading event…'}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Custom Preferences (optional)</label>
          <textarea
            className="textarea"
            rows={2}
            placeholder="e.g. Prefer outdoor venue, include traditional rituals, focus on photography budget..."
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || generateMutation.isPending}
          className="btn-primary btn-lg w-full"
        >
          {generating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Generating your plan… (this takes ~10 seconds)
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Complete Plan
            </>
          )}
        </button>

        {generating && (
          <div className="mt-3 text-xs text-slate-400 text-center">
            🤖 AI is creating: checklist, budget, vendors, timeline, themes & tips…
          </div>
        )}
      </div>

      {/* Previous plans */}
      {plans.length > 0 && (
        <div className="glass-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm">Previous Plans</h3>
            <button onClick={() => refetchPlans()} className="btn-icon text-slate-400">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {plans.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                className={`btn-sm ${activePlanId === p.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                Plan {plans.length - i}
                {p.applied && <Check size={12} className="text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show active plan */}
      {activePlanId && activePlan ? (
        <PlanView
          plan={activePlan.response}
          planId={activePlanId}
          eventId={eventId}
          applied={activePlan.applied}
        />
      ) : !activePlanId && latestPlan && !generating ? (
        <div className="text-center py-6 glass">
          <Sparkles size={32} className="text-purple-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-3">
            You have {plans.length} previous plan{plans.length > 1 ? 's' : ''}. Select one above or generate a new plan.
          </p>
          <button onClick={() => setActivePlanId(latestPlan.id)} className="btn-primary">
            View Latest Plan
          </button>
        </div>
      ) : !generating && plans.length === 0 ? (
        <div className="text-center py-12 glass">
          <div className="text-5xl mb-4 animate-float">🤖</div>
          <h3 className="text-xl font-bold text-white font-display mb-2">Ready to plan your event?</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Click "Generate Complete Plan" and our AI will create a personalized checklist, budget breakdown,
            vendor suggestions, day-of timeline, and 3 theme ideas — all in under 30 seconds.
          </p>
        </div>
      ) : null}
    </div>
  )
}
