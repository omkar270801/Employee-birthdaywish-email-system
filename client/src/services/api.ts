const API_BASE = '/api';

async function request(endpoint: string, options: RequestInit = {}, tokenKey = 'token') {
  const token = localStorage.getItem(tokenKey);

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  let data: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: response.statusText || 'Request failed' };
  }

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  employees: {
    getAll: (filters?: { search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      return request(`/employees${params.toString() ? `?${params.toString()}` : ''}`);
    },
    getById: (id: string) => request(`/employees/${id}`),
    create: (data: any) => request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/employees/${id}`, {
      method: 'DELETE',
    }),
    upload: (file: File, sheetName?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (sheetName) {
        formData.append('sheetName', sheetName);
      }
      const token = localStorage.getItem('token');
      return fetch(`${API_BASE}/employees/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }).then(async res => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error(res.statusText || 'Upload failed');
      });
    },
  },

  templates: {
    getAll: () => request('/templates'),
    getById: (id: string) => request(`/templates/${id}`),
    create: (data: any) => request('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/templates/${id}`, {
      method: 'DELETE',
    }),
  },

  birthdays: {
    getToday: () => request('/birthdays/today'),
    getUpcoming: (days?: number) => request(`/birthdays/upcoming?days=${days || 7}`),
    trigger: () => request('/birthdays/send', { method: 'POST' }),
    sendToEmployee: (employeeId: string) => request(`/birthdays/send/${employeeId}`, { method: 'POST' }),
  },

  emails: {
    getHistory: (filters?: any) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      return request(`/emails/history?${params.toString()}`);
    },
    delete: (id: string) => request(`/emails/history/${id}`, { method: 'DELETE' }),
    test: (data: any) => request('/emails/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  dashboard: {
    getStats: () => request('/dashboard/stats'),
  },

  settings: {
    getStats: () => request('/settings/stats'),
    cleanup: (data: any) => request('/settings/cleanup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  developer: {
    login: (email: string, password: string) =>
      request('/developer/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getStatus: () => request('/developer/status', {}, 'developerToken'),
    getHealth: () => request('/developer/health', {}, 'developerToken'),
    getScheduler: () => request('/developer/scheduler', {}, 'developerToken'),
    getStatistics: () => request('/developer/statistics', {}, 'developerToken'),
    getLogs: (limit?: number) => request(`/developer/logs${limit ? `?limit=${limit}` : ''}`, {}, 'developerToken'),
  },
};
