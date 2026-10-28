import translations from '../i18n/translations'
import { useAuthStore } from '../store/authStore'

export function useT() {
  const language = useAuthStore((s) => s.language)
  const t = translations[language] || translations.en
  
  // Deep get helper: t('common.save') or t('nav.dashboard')
  function get(key) {
    const parts = key.split('.')
    let val = t
    for (const p of parts) {
      val = val?.[p]
      if (val === undefined) {
        // Fallback to English
        let en = translations.en
        for (const ep of parts) en = en?.[ep]
        return en || key
      }
    }
    return val
  }
  
  return get
}

// Format currency in Indian format
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}

// Format date
export function formatDate(date, options = {}) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options })
}

// Days until date
export function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
}

// Event type config
export const EVENT_TYPES = {
  wedding: {
    label: 'Wedding',
    emoji: '💍',
    color: 'wedding',
    gradient: 'from-purple-600 to-pink-600',
    bg: 'from-purple-900/30 to-pink-900/20',
    accent: '#d946ef',
    border: 'border-purple-500/40',
  },
  birthday: {
    label: 'Birthday',
    emoji: '🎂',
    color: 'birthday',
    gradient: 'from-orange-500 to-red-500',
    bg: 'from-orange-900/30 to-red-900/20',
    accent: '#f97316',
    border: 'border-orange-500/40',
  },
  college: {
    label: 'College Event',
    emoji: '🎓',
    color: 'college',
    gradient: 'from-blue-600 to-cyan-600',
    bg: 'from-blue-900/30 to-cyan-900/20',
    accent: '#3b82f6',
    border: 'border-blue-500/40',
  },
  community: {
    label: 'Community',
    emoji: '🪔',
    color: 'community',
    gradient: 'from-yellow-500 to-amber-500',
    bg: 'from-yellow-900/30 to-amber-900/20',
    accent: '#eab308',
    border: 'border-yellow-500/40',
  },
}

export function getEventConfig(type) {
  return EVENT_TYPES[type] || EVENT_TYPES.community
}

// RSVP status config
export const RSVP_CONFIG = {
  yes: { label: 'Going', class: 'badge-green', dot: 'bg-emerald-400' },
  no: { label: 'Not Going', class: 'badge-red', dot: 'bg-red-400' },
  maybe: { label: 'Maybe', class: 'badge-yellow', dot: 'bg-yellow-400' },
  pending: { label: 'Pending', class: 'badge-gray', dot: 'bg-slate-400' },
}

// Task priority config
export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', class: 'badge-red' },
  high: { label: 'High', class: 'badge-yellow' },
  medium: { label: 'Medium', class: 'badge-blue' },
  low: { label: 'Low', class: 'badge-gray' },
}

// Task status config
export const STATUS_CONFIG = {
  todo: { label: 'To Do', class: 'badge-gray' },
  in_progress: { label: 'In Progress', class: 'badge-blue' },
  done: { label: 'Done', class: 'badge-green' },
  blocked: { label: 'Blocked', class: 'badge-red' },
}
