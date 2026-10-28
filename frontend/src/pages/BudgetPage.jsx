import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign, Plus, X, Edit2, Trash2, ChevronLeft,
  TrendingUp, TrendingDown, Sparkles, Check, AlertTriangle
} from 'lucide-react'
import { budgetApi } from '../services/api'
import { formatINR, getEventConfig } from '../utils/helpers'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Videography', 'Music & DJ',
  'Attire & Makeup', 'Invitations', 'Transport', 'Accommodation', 'Gifts & Favors',
  'Flowers', 'Lighting', 'Priest / Officiant', 'Miscellaneous'
]

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7']

function BudgetModal({ item, eventId, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!item
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || CATEGORIES[0],
    estimated: item?.estimated ?? '',
    actual: item?.actual ?? '',
    paid: item?.paid ?? 0,
    vendorName: item?.vendorName || '',
    notes: item?.notes || '',
  })

  const createMutation = useMutation({
    mutationFn: (data) => budgetApi.create(eventId, data),
    onSuccess: () => { qc.invalidateQueries(['budget', eventId]); toast.success('Budget item added!'); onClose() },
    onError: () => toast.error('Failed to add item'),
  })
  const updateMutation = useMutation({
    mutationFn: (data) => budgetApi.update(eventId, item.id, data),
    onSuccess: () => { qc.invalidateQueries(['budget', eventId]); toast.success('Updated!'); onClose() },
    onError: () => toast.error('Failed to update'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    const payload = {
      ...form,
      estimated: parseFloat(form.estimated) || 0,
      actual: parseFloat(form.actual) || 0,
      paid: parseFloat(form.paid) || 0,
    }
    if (isEdit) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-display">
            {isEdit ? 'Edit Budget Item' : 'Add Budget Item'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name *</label>
              <input
                className="input"
                placeholder="e.g. Catering for 200 guests"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Vendor Name</label>
              <input
                className="input"
                placeholder="Optional vendor"
                value={form.vendorName}
                onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Estimated (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.estimated}
                onChange={e => setForm(f => ({ ...f, estimated: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Actual (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.actual}
                onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Amount Paid (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.paid}
                onChange={e => setForm(f => ({ ...f, paid: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="textarea"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const { id: eventId } = useParams()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['budget', eventId],
    queryFn: () => budgetApi.get(eventId).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId) => budgetApi.delete(eventId, itemId),
    onSuccess: () => { qc.invalidateQueries(['budget', eventId]); toast.success('Item removed') },
    onError: () => toast.error('Failed to delete'),
  })

  function handleDelete(item) {
    if (!window.confirm(`Remove "${item.name}"?`)) return
    deleteMutation.mutate(item.id)
  }

  // Aggregations
  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0)
  const totalActual = items.reduce((s, i) => s + i.actual, 0)
  const totalPaid = items.reduce((s, i) => s + i.paid, 0)
  const totalRemaining = totalActual - totalPaid
  const isOverBudget = totalActual > totalEstimated

  // Chart data by category
  const byCategory = items.reduce((acc, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = { estimated: 0, actual: 0 }
    acc[cat].estimated += item.estimated
    acc[cat].actual += item.actual
    return acc
  }, {})

  const chartData = Object.entries(byCategory).map(([name, v]) => ({ name, ...v }))
  const pieData = chartData.filter(d => d.estimated > 0)

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/events/${eventId}`} className="btn-icon text-slate-400">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-display">Budget Tracker</h1>
          <p className="text-sm text-slate-400">{items.length} line items</p>
        </div>
        <Link to={`/events/${eventId}/ai`} className="btn-secondary btn-sm">
          <Sparkles size={14} /> AI Breakdown
        </Link>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-sm p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Estimated</div>
          <div className="text-xl font-bold text-blue-400">{formatINR(totalEstimated)}</div>
        </div>
        <div className={`glass-sm p-4 ${isOverBudget ? 'bg-red-500/10 border-red-500/20' : ''}`}>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Actual Spend</div>
          <div className={`text-xl font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatINR(totalActual)}
          </div>
          {isOverBudget && (
            <div className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
              <TrendingUp size={10} /> +{formatINR(totalActual - totalEstimated)} over
            </div>
          )}
        </div>
        <div className="glass-sm p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Paid</div>
          <div className="text-xl font-bold text-emerald-400">{formatINR(totalPaid)}</div>
        </div>
        <div className={`glass-sm p-4 ${totalRemaining > 0 ? 'bg-amber-500/10' : ''}`}>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">Pending Payment</div>
          <div className={`text-xl font-bold ${totalRemaining > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {formatINR(Math.max(0, totalRemaining))}
          </div>
        </div>
      </div>

      {/* Over budget warning */}
      {isOverBudget && (
        <div className="alert-warning mb-6 flex items-center gap-2">
          <AlertTriangle size={16} />
          You are <strong>{formatINR(totalActual - totalEstimated)}</strong> over your estimated budget.
        </div>
      )}

      {/* Charts */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie chart */}
          <div className="glass p-5">
            <h3 className="section-title mb-4">Spend by Category</h3>
            {pieData.length > 0 ? (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="estimated" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatINR(v)}
                        contentStyle={{ background: '#1a1a27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                  {pieData.map((d, i) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-500 text-sm">No data</div>
            )}
          </div>

          {/* Bar chart: estimated vs actual */}
          {chartData.length > 0 && (
            <div className="glass p-5">
              <h3 className="section-title mb-4">Estimated vs Actual</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => formatINR(v)}
                      contentStyle={{ background: '#1a1a27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="estimated" fill="#3b82f6" radius={[4,4,0,0]} name="Estimated" />
                    <Bar dataKey="actual" fill="#8b5cf6" radius={[4,4,0,0]} name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state glass">
          <DollarSign size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white font-display mb-2">No budget items yet</h3>
          <p className="text-slate-400 text-sm mb-6">Track every expense. Add items manually or generate a breakdown with AI.</p>
          <div className="flex gap-3">
            <Link to={`/events/${eventId}/ai`} className="btn-secondary">
              <Sparkles size={16} /> AI Breakdown
            </Link>
            <button onClick={() => setModal('add')} className="btn-primary">
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Paid</th>
                <th>Status</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const diff = item.actual - item.estimated
                const fullPaid = item.paid >= item.actual && item.actual > 0
                return (
                  <tr key={item.id} className="group">
                    <td>
                      <div className="font-medium text-white text-sm">{item.name}</div>
                      {item.vendorName && <div className="text-xs text-slate-500">{item.vendorName}</div>}
                      {item.aiGenerated && <span className="text-xs text-purple-400 flex items-center gap-1 mt-0.5"><Sparkles size={9} /> AI</span>}
                    </td>
                    <td><span className="badge badge-gray">{item.category}</span></td>
                    <td className="text-slate-300">{formatINR(item.estimated)}</td>
                    <td>
                      <span className={diff > 0 ? 'text-red-400 font-medium' : diff < 0 ? 'text-emerald-400' : 'text-slate-300'}>
                        {formatINR(item.actual)}
                      </span>
                      {diff !== 0 && item.actual > 0 && (
                        <div className="text-xs mt-0.5 flex items-center gap-0.5">
                          {diff > 0
                            ? <><TrendingUp size={10} className="text-red-400" /><span className="text-red-400">+{formatINR(diff)}</span></>
                            : <><TrendingDown size={10} className="text-emerald-400" /><span className="text-emerald-400">{formatINR(diff)}</span></>}
                        </div>
                      )}
                    </td>
                    <td className="text-slate-300">{formatINR(item.paid)}</td>
                    <td>
                      {fullPaid ? (
                        <span className="badge badge-green"><Check size={10} /> Paid</span>
                      ) : item.paid > 0 ? (
                        <span className="badge badge-yellow">Partial</span>
                      ) : (
                        <span className="badge badge-gray">Pending</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ edit: item })} className="btn-icon text-blue-400 hover:text-blue-300">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item)} className="btn-icon text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
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

      {/* Modals */}
      {modal === 'add' && <BudgetModal eventId={eventId} onClose={() => setModal(null)} />}
      {modal?.edit && <BudgetModal item={modal.edit} eventId={eventId} onClose={() => setModal(null)} />}
    </div>
  )
}
