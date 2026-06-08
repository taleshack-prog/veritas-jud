import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@veritas:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('@veritas:token');
      localStorage.removeItem('@veritas:user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login   : (d) => api.post('/auth/login', d),
  me      : ()  => api.get('/auth/me'),
};

export const complaintsAPI = {
  create: (d)      => api.post('/complaints', d),
  list  : ()       => api.get('/complaints'),
  get   : (id)     => api.get(`/complaints/${id}`),
  status: (id, s)  => api.patch(`/complaints/${id}/status`, { status: s }),
  chat  : (msgs)   => api.post('/complaints/chat', { messages: msgs }),
};

export const documentsAPI = {
  generate: (d)  => api.post('/documents/generate', d),
  list    : ()   => api.get('/documents'),
  get     : (id) => api.get(`/documents/${id}`),
  pdfUrl  : (id) => `${API_URL}/documents/${id}/pdf`,
};

export const casesAPI = {
  list: ()   => api.get('/cases'),
  get : (id) => api.get(`/cases/${id}`),
};

export const marketplaceAPI = {
  lawyers: (p) => api.get('/marketplace/lawyers', { params: p }),
  sendLead: (d) => api.post('/marketplace/leads', d),
};

export default api;
