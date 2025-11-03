import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Backend API URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
    }
    
    // For 409 conflicts, ensure error message is properly formatted
    if (error.response && error.response.status === 409) {
      // The error should already have the message from backend
      // Backend returns: { message: '...' } or { error: '...' }
      if (!error.response.data.message && error.response.data.error) {
        error.response.data.message = error.response.data.error;
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },
  
  educatorSignup: async (userData: any) => {
    const response = await api.post('/auth/educator/signup', userData);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },
  
  studentSignup: async (userData: any) => {
    const response = await api.post('/auth/student/signup', userData);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },
  
  logout: async (refreshToken: string) => {
    const result = await api.post('/auth/logout', { refresh_token: refreshToken });
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return result;
  },
  
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }
    return response.data;
  },
  
  getCurrentUser: async () => {
    return await api.get('/users/me');
  }
};

// Educator services
export const educatorService = {
  getProfile: async () => {
    return await api.get('/educators/me');
  },
  
  updateProfile: async (profileData: any) => {
    return await api.put('/educators/me', profileData);
  },
  
  getModules: async (educatorId: string) => {
    return await api.get(`/educators/${educatorId}/modules`);
  }
};

// Student services
export const studentService = {
  getProfile: async () => {
    return await api.get('/students/me');
  },
  
  updateProfile: async (profileData: any) => {
    return await api.put('/students/me', profileData);
  },
  
  getEnrollments: async () => {
    return await api.get('/students/me/enrollments');
  }
};

// Module services
export const moduleService = {
  getModules: async () => {
    return await api.get('/modules');
  },
  
  getModuleById: async (moduleId: string) => {
    return await api.get(`/modules/${moduleId}`);
  },
  
  createModule: async (moduleData: any) => {
    return await api.post('/modules', moduleData);
  },
  // Generate a module via AI agents (backend will create module + problems)
  generateModule: async (payload: any) => {
    return await api.post('/modules/generate', payload);
  },
  
  updateModule: async (moduleId: string, moduleData: any) => {
    return await api.put(`/modules/${moduleId}`, moduleData);
  },
  
  deleteModule: async (moduleId: string) => {
    return await api.delete(`/modules/${moduleId}`);
  }
};

// Problem services
export const problemService = {
  getProblems: async (moduleId: string) => {
    return await api.get(`/modules/${moduleId}/problems`);
  },
  
  getProblemById: async (problemId: string) => {
    return await api.get(`/problems/${problemId}`);
  },
  
  createProblem: async (moduleId: string, problemData: any) => {
    return await api.post(`/modules/${moduleId}/problems`, problemData);
  },
  
  updateProblem: async (problemId: string, problemData: any) => {
    return await api.put(`/problems/${problemId}`, problemData);
  },
  
  deleteProblem: async (problemId: string) => {
    return await api.delete(`/problems/${problemId}`);
  }
};

// Enrollment services
export const enrollmentService = {
  enrollInModule: async (moduleId: string) => {
    // Backend endpoint is /enrollments/modules/:moduleId/subscribe
    return await api.post(`/enrollments/modules/${moduleId}/subscribe`);
  },
  
  unenrollFromModule: async (moduleId: string) => {
    // Get enrollment ID first, then cancel
    // For now, we'll need to find the enrollment ID from the enrollments list
    const enrollments = await api.get('/students/me/enrollments');
    const enrollment = enrollments.data.find((e: any) => e.module.id === moduleId);
    if (enrollment) {
      return await api.post(`/enrollments/${enrollment.id}/cancel`);
    }
    throw new Error('Enrollment not found');
  },
  
  getEnrollmentStatus: async (moduleId: string) => {
    // Check if student is enrolled by checking enrollments list
    try {
      const enrollments = await api.get('/students/me/enrollments');
      const enrollment = enrollments.data.find((e: any) => 
        e.module.id === moduleId && e.status === 'active'
      );
      return { data: { isEnrolled: !!enrollment } };
    } catch (error) {
      return { data: { isEnrolled: false } };
    }
  }
};

export default api;