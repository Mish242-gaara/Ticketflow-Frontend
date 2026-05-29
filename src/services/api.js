import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ticketflow-backend-h7m6.onrender.com/api', 
  withCredentials: true,
  timeout: 20000,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── EVENTS ────────────────────────────────────────────────────────────────────
export const getEvents       = ()         => api.get('/events');
export const getEvent        = (slug)     => api.get(`/events/${slug}`);
export const createEvent     = (data)     => api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateEvent     = (id, data) => api.put(`/events/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteEvent     = (id)       => api.delete(`/events/${id}`);
export const getAttendees    = (id)       => api.get(`/events/${id}/attendees`);
export const getAdminEvents  = ()         => api.get('/admin/events');
export const getAdminEventById = (id)     => api.get(`/admin/events/${id}`);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const login    = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe    = ()     => api.get('/auth/me');

// ── TICKETS ───────────────────────────────────────────────────────────────────
export const reserveTicket  = (data) => api.post('/tickets/reserve', data);
export const checkPayment   = (txRef) => api.get(`/tickets/check-payment/${txRef}`);
export const getMyTickets   = ()     => api.get('/tickets/my');
export const getTicket      = (uuid) => api.get(`/tickets/${uuid}`);
export const downloadTicket = (uuid) => api.get(`/tickets/${uuid}/download`, { responseType: 'blob' });

// ── VERIFY ────────────────────────────────────────────────────────────────────
export const verifyTicket = (qrData) => api.post('/verify-ticket', { qr_data: qrData });

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
