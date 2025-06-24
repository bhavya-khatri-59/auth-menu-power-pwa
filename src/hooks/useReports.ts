
import { useQuery } from '@tanstack/react-query';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
}

const fetchReports = async (department: string): Promise<Report[]> => {
  // Get JWT token from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || localStorage.getItem('jwt_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`http://localhost:4000/api/reports/${encodeURIComponent(department)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.reports;
};

export const useReports = (department: string) => {
  return useQuery({
    queryKey: ['reports', department],
    queryFn: () => fetchReports(department),
    enabled: !!department,
  });
};
