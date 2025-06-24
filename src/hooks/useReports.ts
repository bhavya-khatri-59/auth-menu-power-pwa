
import { useQuery } from '@tanstack/react-query';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
}

const fetchReports = async (department: string): Promise<Report[]> => {
  const response = await fetch(`http://localhost:4000/api/reports/${encodeURIComponent(department)}`);
  
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
