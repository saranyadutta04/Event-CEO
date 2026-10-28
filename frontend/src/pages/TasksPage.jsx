import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckSquare, Plus, X, Edit2, Trash2, ChevronLeft,
  Circle, Clock, AlertCircle, CheckCircle2, Filter, Sparkles
} from 'lucide-react'
import { tasksApi } from '../services/api'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/helpers'
import toast from 'react-hot-toast'

const STATUS_ICON = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle,
}

const STATUS_COLORS = {
  todo: 'text-slate-400',
  in_progress: 'text-blue-400',
  done: 'text-emerald-400',
  blocked: 'text-red-400',
}

const CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Music', 'Attire',
  'Invitations', 'Transport', 'Accommodation', 'Gifts', 'Documentation', 'Other'
]

function TaskModal({ task, eventId, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!task
  const [form, setForm] = useState({
    title: task?.title || '',
    category: task?.category || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    notes: task?.notes || '',
  })

  const createMutation = useMutation({
    mutationFn: (data) => tasksApi.create(eventId, data),
    onSuccess: () => { qc.invalidateQueries(['tasks', eventId]); toast.success('Task created!'); onClose() },
    onError: () => toast.error('Failed to create task'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => tasksApi.update(eventId, task.id, data),
    onSuccess: () => { qc.invalidateQueries(['tasks', eventId]); toast.success('Task updated!'); onClose() },
    onError: () => toast.error('Failed to update task'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    const payload = { ...form, dueDate: form.dueDate || undefined }
    if (isEdit) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-display">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-icon text-slate-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input
              className="input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Uncategorized</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Additional notes or description..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { id: eventId } = useParams()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', eventId],
    queryFn: () => tasksApi.list(eventId).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) => tasksApi.update(eventId, taskId, data),
    onSuccess: () => qc.invalidateQueries(['tasks', eventId]),
    onError: () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId) => tasksApi.delete(eventId, taskId),
    onSuccess: () => { qc.invalidateQueries(['tasks', eventId]); toast.success('Task deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  function cycleStatus(task) {
    const statuses = ['todo', 'in_progress', 'done', 'blocked']
    const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length]
    updateMutation.mutate({ taskId: task.id, data: { status: next } })
  }

  function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    deleteMutation.mutate(task.id)
  }

  // Filter & group
  const filtered = tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  // Group by category
  const grouped = filtered.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  // Progress stats
  const done = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/events/${eventId}`} className="btn-icon text-slate-400">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-display">Task Checklist</h1>
          <p className="text-sm text-slate-400">{done}/{tasks.length} completed</p>
        </div>
        <Link to={`/events/${eventId}/ai`} className="btn-secondary btn-sm">
          <Sparkles size={14} /> Generate with AI
        </Link>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="glass-sm p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-300 font-medium">Overall Progress</span>
            <span className="font-bold text-white">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-purple-500 to-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Status counters */}
          <div className="flex gap-4 mt-3 text-xs text-slate-400">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className={STATUS_COLORS[k]}>●</span>
                {tasks.filter(t => t.status === k).length} {v.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All
        </button>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setStatusFilter(statusFilter === k ? '' : k)}
            className={`btn-sm ${statusFilter === k ? 'btn-primary' : 'btn-secondary'}`}
          >
            {v.label}
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1" />
        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setPriorityFilter(priorityFilter === k ? '' : k)}
            className={`btn-sm ${priorityFilter === k ? 'btn-primary' : 'btn-secondary'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass">
          <CheckSquare size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white font-display mb-2">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {tasks.length === 0
              ? 'Add tasks manually or let AI generate a complete checklist'
              : 'Try removing some filters'}
          </p>
          {tasks.length === 0 && (
            <div className="flex gap-3">
              <Link to={`/events/${eventId}/ai`} className="btn-secondary">
                <Sparkles size={16} /> Generate with AI
              </Link>
              <button onClick={() => setModal('add')} className="btn-primary">
                <Plus size={16} /> Add Task
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryTasks]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-300">{category}</h3>
                <span className="badge badge-gray">{categoryTasks.filter(t => t.status === 'done').length}/{categoryTasks.length}</span>
              </div>
              <div className="space-y-2">
                {categoryTasks.map(task => {
                  const StatusIcon = STATUS_ICON[task.status] || Circle
                  const priorityCfg = PRIORITY_CONFIG[task.priority]
                  return (
                    <div
                      key={task.id}
                      className={`glass-sm p-4 flex items-center gap-4 group transition-all duration-200 hover:bg-white/5 ${
                        task.status === 'done' ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => cycleStatus(task)}
                        className={`flex-shrink-0 transition-colors ${STATUS_COLORS[task.status]} hover:scale-110`}
                        title="Click to cycle status"
                      >
                        <StatusIcon size={20} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.dueDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {task.aiGenerated && (
                            <span className="text-xs text-purple-400 flex items-center gap-1">
                              <Sparkles size={10} /> AI
                            </span>
                          )}
                          {task.notes && (
                            <span className="text-xs text-slate-500 truncate max-w-[200px]">{task.notes}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {priorityCfg && (
                          <span className={`${priorityCfg.class} text-xs hidden sm:inline-flex`}>
                            {priorityCfg.label}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal({ edit: task })}
                            className="btn-icon text-blue-400 hover:text-blue-300"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            className="btn-icon text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && <TaskModal eventId={eventId} onClose={() => setModal(null)} />}
      {modal?.edit && <TaskModal task={modal.edit} eventId={eventId} onClose={() => setModal(null)} />}
    </div>
  )
}
