// src/services/api.js
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach Firebase ID token to every request automatically
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Admin (dedicated route — single auth check, one round-trip) ──
export const getAdminAll    = ()  => api.get('/admin/all');
export const getAdminStats  = ()  => api.get('/admin/stats');

// ── Bookings ──
export const getBookings       = ()           => api.get('/bookings');
export const getMyBookings     = ()           => api.get('/bookings');
export const getBookingStats   = ()           => api.get('/bookings/stats');
export const getRecyclerPickups= ()           => api.get('/bookings/recycler');
export const createBooking     = (data)       => api.post('/bookings', data);
export const updateStatus      = (id, status) => api.patch(`/bookings/${id}/status`, { status });
export const markPaymentPaid   = (id, razorpayPaymentId) => api.patch(`/bookings/${id}/payment`, { razorpayPaymentId });
export const deleteBooking     = (id)         => api.delete(`/bookings/${id}`);

// ── Users ──
export const syncUser          = (data)       => api.post('/users/sync', data);
export const getUserRole       = ()           => api.get('/users/role');
export const getAllUsers        = ()           => api.get('/users');
export const requestWithdrawal  = (data)       => api.post('/users/withdraw', data);

// ── Recyclers ──
export const getRecyclers      = ()           => api.get('/recyclers');
export const addRecycler       = (data)       => api.post('/recyclers', data);
export const deleteRecycler    = (id)         => api.delete(`/recyclers/${id}`);

// ── AI ──
export const chatWithAI        = (messages)   => api.post('/ai/chat', { messages });
export const estimatePrice     = (data)       => api.post('/ai/estimate', data);

// ── Payments ──
export const createRazorpayOrder = (amount, bookingId) => api.post('/payments/order', { amount, bookingId });
export const verifyPayment       = (data)              => api.post('/payments/verify', data);
export const getRazorpayKey      = ()                  => api.get('/payments/key');

export default api;

// ── Gamification & Carbon (new) ──
export const getGamification  = (uid)    => api.get(`/ai/gamification/${uid}`);
export const getLeaderboard   = ()       => api.get('/ai/leaderboard');
export const calcCarbon       = (devices)=> api.post('/ai/carbon', { devices });
