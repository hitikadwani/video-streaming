import axios from 'axios';

const API_BASE = 'http://localhost:5000';

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