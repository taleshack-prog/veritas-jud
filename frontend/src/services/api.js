import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de Request: injeta token JWT ───────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@veritas:token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ── Interceptor de Response: trata erros globalmente ───────
api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado — limpa storage
      await AsyncStorage.multiRemove(['@veritas:token', '@veritas:user']);
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login   : (data) => api.post('/auth/login', data),
  me      : ()     => api.get('/auth/me'),
};

// ── Complaints ─────────────────────────────────────────────
export const complaintsAPI = {
  create : (data)   => api.post('/complaints', data),
  list   : ()       => api.get('/complaints'),
  get    : (id)     => api.get(`/complaints/${id}`),
  status : (id, s)  => api.patch(`/complaints/${id}/status`, { status: s }),
  chat   : (msgs)   => api.post('/complaints/chat', { messages: msgs }),
};

// ── Documents ──────────────────────────────────────────────
export const documentsAPI = {
  generate: (data) => api.post('/documents/generate', data),
  list    : ()     => api.get('/documents'),
  get     : (id)   => api.get(`/documents/${id}`),
  pdfUrl  : (id)   => `${API_URL}/documents/${id}/pdf`,
};

// ── Cases ──────────────────────────────────────────────────
export const casesAPI = {
  list: ()   => api.get('/cases'),
  get : (id) => api.get(`/cases/${id}`),
};

// ── Marketplace ────────────────────────────────────────────
export const marketplaceAPI = {
  lawyers    : (params) => api.get('/marketplace/lawyers', { params }),
  sendLead   : (data)   => api.post('/marketplace/leads', data),
  registerLawyer: (data) => api.post('/marketplace/register-lawyer', data),
};

export default api;
