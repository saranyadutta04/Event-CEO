import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Plus, Search, Filter, Upload, QrCode,
  Trash2, Edit2, X, Check, ChevronLeft, Download,
  Phone, Mail, UtensilsCrossed, UserPlus
} from 'lucide-react'
import { guestsApi } from '../services/api'
import { RSVP_CONFIG } from '../utils/helpers'
import toast from 'react-hot-toast'

const RSVP_OPTIONS = ['yes', 'no', 'maybe', 'pending']
const MEAL_OPTIONS = ['', 'veg', 'non-veg', 'vegan', 'jain', 'no preference']

function GuestModal({ guest, eventId, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!guest
  const [form, setForm] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    group: guest?.group || '',
    rsvpStatus: guest?.rsvpStatus || 'pending',
    mealPref: guest?.mealPref || '',
    plusOnes: guest?.plusOnes || 0,
    notes: guest?.notes || '',
  })

  const createMutation = useMutation({
    mutationFn: (data) => guestsApi.create(eventId, data),
    onSuccess: () => {
      qc.invalidateQueries(['guests', eventId])
      toast.success('Guest added!')
      onClose()
    },
    onError: () => toast.error('Failed to add guest'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => guestsApi.update(eventId, guest.id, data),
    onSuccess: () => {
      qc.invalidateQueries(['guests', eventId])
      toast.success('Guest updated!')
      onClose()
    },
    onError: () => toast.error('Failed to update guest'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    const payload = { ...form, plusOnes: Number(form.plusOnes) }
    if (isEdit) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  const loading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-display">
            {isEdit ? 'Edit Guest' : 'Add Guest'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                placeholder="Full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Group / Side</label>
              <input
                className="input"
                placeholder="e.g. Bride's side, Friends"
                value={form.group}
                onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="email@example.com"
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
            <div>
              <label className="label">RSVP Status</label>
              <select
                className="select"
                value={form.rsvpStatus}
                onChange={e => setForm(f => ({ ...f, rsvpStatus: e.target.value }))}
              >
                {RSVP_OPTIONS.map(s => (
                  <option key={s} value={s}>{RSVP_CONFIG[s]?.label || s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Meal Preference</label>
              <select
                className="select"
                value={form.mealPref}
                onChange={e => setForm(f => ({ ...f, mealPref: e.target.value }))}
              >
                {MEAL_OPTIONS.map(m => (
                  <option key={m} value={m}>{m || 'Not specified'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Plus Ones</label>
              <input
                className="input"
                type="number"
                min="0"
                max="10"
                value={form.plusOnes}
                onChange={e => setForm(f => ({ ...f, plusOnes: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Any special requirements or notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : isEdit ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function QRModal({ guest, eventId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['qr', eventId, guest.id],
    queryFn: () => guestsApi.getQR(eventId, guest.id).then(r => r.data),
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white font-display">Guest QR Code</h2>
          <button onClick={onClose} className="btn-icon text-slate-400"><X size={18} /></button>
        </div>
        <p className="text-sm text-slate-400 mb-4">{guest.name}</p>
        {isLoading ? (
          <div className="skeleton h-48 w-48 mx-auto rounded-xl" />
        ) : data?.qrDataUrl ? (
          <img src={data.qrDataUrl} alt="QR Code" className="mx-auto rounded-xl border border-white/10 bg-white p-2 w-48 h-48" />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Failed to load QR</div>
        )}
        <p className="text-xs text-slate-500 mt-4">Show this QR for check-in at the event</p>
        {data?.qrDataUrl && (
          <a
            href={data.qrDataUrl}
            download={`qr-${guest.name.replace(/\s+/g, '-')}.png`}
            className="btn-secondary btn-sm mt-3 w-full justify-center"
          >
            <Download size={14} /> Download QR
          </a>
        )}
      </div>
    </div>
  )
}

export default function GuestsPage() {
  const { id: eventId } = useParams()
  const qc = useQueryClient()
  const fileRef = useRef()

  const [search, setSearch] = useState('')
  const [rsvpFilter, setRsvpFilter] = useState('')
  const [modal, setModal] = useState(null) // 'add' | { edit: guest } | { qr: guest }

  const { data, isLoading } = useQuery({
    queryKey: ['guests', eventId, search, rsvpFilter],
    queryFn: () => guestsApi.list(eventId, {
      search: search || undefined,
      rsvp: rsvpFilter || undefined,
      limit: 100,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const guests = data?.guests || []

  const deleteMutation = useMutation({
    mutationFn: (guestId) => guestsApi.delete(eventId, guestId),
    onSuccess: () => {
      qc.invalidateQueries(['guests', eventId])
      toast.success('Guest removed')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const importMutation = useMutation({
    mutationFn: (file) => guestsApi.import(eventId, file),
    onSuccess: (res) => {
      qc.invalidateQueries(['guests', eventId])
      toast.success(`Imported ${res.data.imported} guests!`)
    },
    onError: () => toast.error('Import failed'),
  })

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) importMutation.mutate(file)
    e.target.value = ''
  }

  function handleDelete(guest) {
    if (!window.confirm(`Remove ${guest.name}?`)) return
    deleteMutation.mutate(guest.id)
  }

  // Summary stats
  const rsvpCounts = guests.reduce((acc, g) => {
    acc[g.rsvpStatus] = (acc[g.rsvpStatus] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/events/${eventId}`} className="btn-icon text-slate-400">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-display">Guest List</h1>
          <p className="text-sm text-slate-400">{data?.total || 0} guests total</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importMutation.isPending}
          className="btn-secondary btn-sm"
        >
          <Upload size={14} />
          {importMutation.isPending ? 'Importing…' : 'CSV Import'}
        </button>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> Add Guest
        </button>
      </div>

      {/* RSVP Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {RSVP_OPTIONS.map(status => {
          const cfg = RSVP_CONFIG[status]
          const count = rsvpCounts[status] || 0
          return (
            <button
              key={status}
              onClick={() => setRsvpFilter(rsvpFilter === status ? '' : status)}
              className={`glass-sm p-3 text-center transition-all duration-200 ${rsvpFilter === status ? 'ring-2 ring-purple-500' : 'hover:bg-white/5'}`}
            >
              <div className="text-xl font-bold text-white">{count}</div>
              <div className="text-xs text-slate-400 font-medium">{cfg.label}</div>
              <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${cfg.dot}`} />
            </button>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {rsvpFilter && (
          <button onClick={() => setRsvpFilter('')} className="btn-secondary btn-sm">
            <X size={14} /> Clear filter
          </button>
        )}
      </div>

      {/* Guest Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : guests.length === 0 ? (
        <div className="empty-state glass">
          <Users size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white font-display mb-2">
            {search || rsvpFilter ? 'No guests found' : 'No guests yet'}
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            {search || rsvpFilter
              ? 'Try adjusting your filters'
              : 'Add guests manually or import a CSV file'}
          </p>
          {!search && !rsvpFilter && (
            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="btn-secondary">
                <Upload size={16} /> Import CSV
              </button>
              <button onClick={() => setModal('add')} className="btn-primary">
                <Plus size={16} /> Add Guest
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Group</th>
                <th>RSVP</th>
                <th>Meal</th>
                <th>+1s</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(guest => {
                const cfg = RSVP_CONFIG[guest.rsvpStatus] || RSVP_CONFIG.pending
                return (
                  <tr key={guest.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                          {guest.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{guest.name}</div>
                          {guest.notes && (
                            <div className="text-xs text-slate-500 truncate max-w-[150px]">{guest.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {guest.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail size={11} /> {guest.email}
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone size={11} /> {guest.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {guest.group ? (
                        <span className="badge badge-gray">{guest.group}</span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      <span className={cfg.class}>{cfg.label}</span>
                    </td>
                    <td>
                      {guest.mealPref ? (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <UtensilsCrossed size={11} /> {guest.mealPref}
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      {guest.plusOnes > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-slate-300">
                          <UserPlus size={11} /> +{guest.plusOnes}
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal({ qr: guest })}
                          className="btn-icon text-purple-400 hover:text-purple-300"
                          title="Show QR"
                        >
                          <QrCode size={15} />
                        </button>
                        <button
                          onClick={() => setModal({ edit: guest })}
                          className="btn-icon text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(guest)}
                          className="btn-icon text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV hint */}
      <div className="mt-4 alert-info text-xs">
        💡 <strong>CSV Import tip:</strong> Columns: <code>name, email, phone, group, mealpref, plusones, notes</code>
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <GuestModal eventId={eventId} onClose={() => setModal(null)} />
      )}
      {modal?.edit && (
        <GuestModal guest={modal.edit} eventId={eventId} onClose={() => setModal(null)} />
      )}
      {modal?.qr && (
        <QRModal guest={modal.qr} eventId={eventId} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
