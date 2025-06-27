
// API configuration for different environments
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  reports: (department: string) => `${API_BASE_URL}/api/reports/${encodeURIComponent(department)}`,
  loginUrl: `${API_BASE_URL}/auth/login-url`,
  manualLogin: `${API_BASE_URL}/auth/manual-login`,
} as const;
