
// API configuration for different environments
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  reports: (department: string) => `${API_BASE_URL}/api/reports/${encodeURIComponent(department)}`,
  loginUrl: `${API_BASE_URL}/auth/login-url`,
  manualLogin: `${API_BASE_URL}/auth/manual-login`,
  adminReports: `${API_BASE_URL}/api/admin/reports`,
  adminUpdateReports: `${API_BASE_URL}/api/admin/reports`,
  adminUpdateReport: (department: string, reportId: string) => 
    `${API_BASE_URL}/api/admin/reports/${encodeURIComponent(department)}/${encodeURIComponent(reportId)}`,
  adminStats: `${API_BASE_URL}/api/admin/stats`,
  adminDepartments: `${API_BASE_URL}/api/admin/departments`,
  adminAllReports: `${API_BASE_URL}/api/admin/all-reports`,
  adminDeleteDepartment: (departmentName: string) => 
    `${API_BASE_URL}/api/admin/departments/${encodeURIComponent(departmentName)}`,
} as const;
