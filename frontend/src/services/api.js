import axios from 'axios';

// Em produção e nas prévias da Vercel, /api é encaminhado ao Render.
// Em desenvolvimento local, o Vite faz o mesmo encaminhamento.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 90000,
});

export default api;
