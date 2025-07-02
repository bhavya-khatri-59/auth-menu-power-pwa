
const BASE_URL = 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Auth endpoints
  loginUrl: `${BASE_URL}/auth/login-url`,
  manualLogin: `${BASE_URL}/auth/manual-login`,
  
  // Reports endpoints
  reports: (department: string) => `${BASE_URL}/api/reports/${encodeURIComponent(department)}`,
  reportDetails: (department: string, reportId: string) => `${BASE_URL}/api/reports/${encodeURIComponent(department)}/${reportId}`,
  generateEmbed: `${BASE_URL}/api/reports/generate-embed`,
  
  // Admin endpoints
  adminReports: `${BASE_URL}/api/admin/reports`,
  adminAllReports: `${BASE_URL}/api/admin/all-reports`,
  adminUpdateReports: `${BASE_URL}/api/admin/reports`,
  adminUpdateReport: (department: string, reportId: string) => `${BASE_URL}/api/admin/reports/${encodeURIComponent(department)}/${reportId}`,
  adminStats: `${BASE_URL}/api/admin/stats`,
  adminDepartments: `${BASE_URL}/api/admin/departments`,
  adminDeleteDepartment: (departmentName: string) => `${BASE_URL}/api/admin/departments/${encodeURIComponent(departmentName)}`,
  adminGenerateEmbed: `${BASE_URL}/api/admin/generate-embed`
};
