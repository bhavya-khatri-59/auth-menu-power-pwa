
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { getAuthToken } from '../lib/auth';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
  isActive?: boolean;
  embedUrl?: string;
  embedToken?: string;
  datasetId?: string;
  sharedDatasetId?: string;
}

const fetchReports = async (department: string): Promise<Report[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(API_ENDPOINTS.reports(department), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.statusText}`);
  }

  const data = await response.json();
  return data.reports;
};

const fetchReportDetails = async (department: string, reportId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(API_ENDPOINTS.reportDetails(department, reportId), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch report details: ${response.statusText}`);
  }

  return response.json();
};

export const useReports = (department: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<Report[], Error>({
    queryKey: ['reports', department],
    queryFn: () => fetchReports(department),
    enabled: !!department,
  });

  // Use useEffect instead of deprecated onSuccess
  useEffect(() => {
    if (query.data) {
      query.data.forEach(report => {
        queryClient.prefetchQuery({
          queryKey: ['reportDetails', department, report.id],
          queryFn: () => fetchReportDetails(department, report.id),
        });
      });
    }
  }, [query.data, queryClient, department]);

  return query;
};

export const useReportDetails = (department: string, reportId: string | null) => {
  return useQuery<Report, Error>({
    queryKey: ['reportDetails', department, reportId],
    queryFn: () => fetchReportDetails(department, reportId!),
    enabled: !!department && !!reportId,
  });
};
