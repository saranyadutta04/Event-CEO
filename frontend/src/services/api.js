import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: 'https://event-ceo-backend-glptvdaw-saranya4.vercel.app/api',
  timeout: 30000,
})

// Request interceptor: attach auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Convenience helpers
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const eventsApi = {
  list: () => api.get('/events'),
  get: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getFunctions: (id) => api.get(`/events/${id}/functions`),
  createFunction: (id, data) => api.post(`/events/${id}/functions`, data),
  deleteFunction: (id, fnId) => api.delete(`/events/${id}/functions/${fnId}`),
}

export const guestsApi = {
  list: (eventId, params) => api.get(`/events/${eventId}/guests`, { params }),
  create: (eventId, data) => api.post(`/events/${eventId}/guests`, data),
  update: (eventId, guestId, data) => api.put(`/events/${eventId}/guests/${guestId}`, data),
  delete: (eventId, guestId) => api.delete(`/events/${eventId}/guests/${guestId}`),
  import: (eventId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/events/${eventId}/guests/import`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getQR: (eventId, guestId) => api.get(`/events/${eventId}/guests/${guestId}/qr`),
}

export const tasksApi = {
  list: (eventId) => api.get(`/events/${eventId}/tasks`),
  create: (eventId, data) => api.post(`/events/${eventId}/tasks`, data),
  update: (eventId, taskId, data) => api.put(`/events/${eventId}/tasks/${taskId}`, data),
  delete: (eventId, taskId) => api.delete(`/events/${eventId}/tasks/${taskId}`),
  bulkCreate: (eventId, tasks) => api.post(`/events/${eventId}/tasks/bulk`, { tasks }),
}

export const budgetApi = {
  get: (eventId) => api.get(`/events/${eventId}/budget`),
  create: (eventId, data) => api.post(`/events/${eventId}/budget`, data),
  update: (eventId, itemId, data) => api.put(`/events/${eventId}/budget/${itemId}`, data),
  delete: (eventId, itemId) => api.delete(`/events/${eventId}/budget/${itemId}`),
  bulkCreate: (eventId, items) => api.post(`/events/${eventId}/budget/bulk`, { items }),
}

export const aiApi = {
  generatePlan: (data) => api.post('/ai/generate-plan', data),
  applyPlan: (planId) => api.post(`/ai/apply-plan/${planId}`),
  generateInvitation: (data) => api.post('/ai/invitation', data),
  listPlans: (eventId) => api.get(`/ai/plans/${eventId}`),
  getPlan: (planId) => api.get(`/ai/plans/detail/${planId}`),
}

export const checkinApi = {
  scan: (qrToken, eventId) => api.post('/checkin/scan', { qrToken, eventId }),
  stats: (eventId) => api.get(`/checkin/event/${eventId}/stats`),
}

export const donationsApi = {
  list: (eventId) => api.get(`/events/${eventId}/donations`),
  create: (eventId, data) => api.post(`/events/${eventId}/donations`, data),
  delete: (eventId, donId) => api.delete(`/events/${eventId}/donations/${donId}`),
}

export const competitionsApi = {
  list: (eventId) => api.get(`/events/${eventId}/competitions`),
  create: (eventId, data) => api.post(`/events/${eventId}/competitions`, data),
  register: (eventId, compId, data) => api.post(`/events/${eventId}/competitions/${compId}/register`, data),
  certUrl: (eventId, compId, regId) => `/api/events/${eventId}/competitions/${compId}/registrations/${regId}/certificate`,
}

export const publicApi = {
  getEvent: (token) => api.get(`/public/event/${token}`),
  rsvp: (token, data) => api.post(`/public/event/${token}/rsvp`, data),
  donate: (token, data) => api.post(`/public/event/${token}/donate`, data),
  registerCompetition: (token, compId, data) => api.post(`/public/event/${token}/competitions/${compId}/register`, data),
}
