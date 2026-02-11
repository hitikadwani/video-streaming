import axios from 'axios';

// Determine API base URL
const getApiBaseUrl = (): string => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production without env var, show clear error
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '⚠️ CRITICAL: REACT_APP_API_URL environment variable is not set!\n' +
      'Please set it in your Vercel project settings.\n' +
      'The app will not work correctly without it.'
    );
    // Return empty string to make the error obvious
    return '';
  }
  
  // Development fallback
  return 'http://localhost:5000';
};

const API_BASE = getApiBaseUrl();

// Log for debugging
console.log('🌐 API Base URL:', API_BASE);
console.log('📦 Environment:', process.env.NODE_ENV);
console.log('🔧 REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'NOT SET');

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (session)
  headers: { 'Content-Type': 'application/json' },
});

// Auth endpoints
export const authApi = {
  register: (email: string, password: string, displayName?: string) =>
    api.post('/api/auth/register', { email, password, display_name: displayName }),

  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  logout: () =>
    api.post('/api/auth/logout'),

  getMe: () =>
    api.get('/api/auth/me'),

  getGoogleAuthUrl: () => `${API_BASE}/api/auth/google`,
  getGitHubAuthUrl: () => `${API_BASE}/api/auth/github`,
};

// Videos
export const videosApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ videos: import('../types/video').Video[]; count: number }>('/api/videos', { params }),
  getById: (id: number) =>
    api.get<{ video: import('../types/video').Video }>(`/api/videos/${id}`),
  search: (params?: { q?: string; tags?: number[]; limit?: number; offset?: number }) => {
    const p: Record<string, string | number> = {};
    if (params?.q) p.q = params.q;
    if (params?.tags?.length) p.tags = params.tags.join(',');
    if (params?.limit != null) p.limit = params.limit;
    if (params?.offset != null) p.offset = params.offset;
    return api.get<{ videos: import('../types/video').Video[]; count: number }>('/api/videos/search', { params: p });
  },
};

// Tags
export const tagsApi = {
  getAll: () =>
    api.get<{ tags: import('../types/video').Tag[] }>('/api/tags'),
};

export { API_BASE };