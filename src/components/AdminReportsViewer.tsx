
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Eye, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import PowerBIViewer from './PowerBIViewer';

// Type definition for report data structure
interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
  clientId?: string;
  reportId?: string;
  datasetId?: string;
  coreDatasetId?: string;
  embedUrl?: string;
  embedToken?: string;
  tenantId?: string;
  isActive: boolean;
  department: string;
}

/**
 * AdminReportsViewer Component - Interface for admins to preview all system reports
 * 
 * This component provides administrators with the ability to:
 * - View all reports across all departments in a unified interface
 * - Generate fresh PowerBI embed tokens for secure report viewing
 * - Preview reports with the same experience as end users
 * - Filter and identify reports by department and status
 * 
 * Key Features:
 * - Cross-department report visibility for admins
 * - Dynamic PowerBI embed token generation for security
 * - Real-time report status indicators (Active/Inactive)
 * - Responsive card-based layout for easy browsing
 * - Integration with PowerBIViewer for seamless report display
 */
const AdminReportsViewer: React.FC = () => {
  // State management for reports data and UI controls
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generatingEmbed, setGeneratingEmbed] = useState(false);

  /**
   * Effect hook to fetch all reports when component mounts
   */
  useEffect(() => {
    fetchAllReports();
  }, []);

  /**
   * Fetches all reports from all departments via admin API endpoint
   * Only accessible to users with admin privileges
   * Handles various error states and data structure validation
   */
  const fetchAllReports = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminAllReports, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      console.log('Fetched reports data:', data);
      
      // Validate data structure before setting state
      if (data.reports && Array.isArray(data.reports)) {
        setReports(data.reports);
      } else {
        console.error('Invalid reports data structure:', data);
        setError('Invalid reports data structure received');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles report viewing by generating fresh PowerBI embed tokens
   * Validates report configuration before attempting to generate embed details
   * Updates selected report with fresh embed token and URL for secure viewing
   * 
   * @param report - Report object containing PowerBI configuration
   */
  const handleViewReport = async (report: Report) => {
    // Validate required PowerBI configuration fields
    if (!report.reportId || !report.datasetId || !report.coreDatasetId) {
      setError('Report is missing required PowerBI configuration (reportId, datasetId, coreDatasetId)');
      return;
    }

    setGeneratingEmbed(true);
    setError('');
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      // Generate fresh embed token and URL for security
      const response = await fetch(API_ENDPOINTS.generateEmbed, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.reportId,
          datasetId: report.datasetId,
          coreDatasetId: report.coreDatasetId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate embed token');
      }

      const { embedToken, embedUrl } = await response.json();
      
      // Create updated report object with fresh embed details
      const updatedReport = {
        ...report,
        embedToken,
        embedUrl
      };
      
      setSelectedReport(updatedReport);
    } catch (err) {
      console.error('Error generating embed token:', err);
      setError((err as Error).message);
    } finally {
      setGeneratingEmbed(false);
    }
  };

  // Render PowerBI viewer when a report is selected
  if (selectedReport) {
    return (
      <PowerBIViewer
        menu={{
          id: selectedReport.id,
          title: selectedReport.title,
          description: selectedReport.description,
          icon: <span>{selectedReport.icon}</span>,
          powerBIReportId: selectedReport.powerBIReportId,
          reportId: selectedReport.reportId,
          embedUrl: selectedReport.embedUrl,
          embedToken: selectedReport.embedToken,
          tenantId: selectedReport.tenantId,
          clientId: selectedReport.clientId
        }}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  // Loading state display
  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading all reports...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header section with title and refresh functionality */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h5>All Reports Viewer</h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchAllReports}
              disabled={loading}
            >
              <RefreshCw size={16} className="me-1" />
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {/* Error message display */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Embed token generation status */}
      {generatingEmbed && (
        <Alert variant="info" className="mb-3">
          <Spinner animation="border" size="sm" className="me-2" />
          Generating fresh embed token...
        </Alert>
      )}

      {/* Reports grid display */}
      <Row className="g-3">
        {reports.map((report) => (
          <Col key={`${report.department}-${report.id}`} md={6} lg={4}>
            <Card className={`h-100 ${!report.isActive ? 'opacity-50' : ''}`}>
              <Card.Body>
                {/* Report header with title and status badges */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold">{report.title}</h6>
                  <div className="d-flex gap-1">
                    {/* Active/Inactive status badge */}
                    <Badge bg={report.isActive ? 'success' : 'secondary'}>
                      {report.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                {/* Department badge */}
                <Badge bg="primary" className="mb-2">{report.department}</Badge>
                
                {/* Report description */}
                <p className="text-muted small mb-2">{report.description}</p>
                
                {/* PowerBI configuration details (truncated for display) */}
                <p className="text-muted small mb-3">
                  <strong>PowerBI ID:</strong> {report.powerBIReportId}<br/>
                  <strong>Report ID:</strong> {report.reportId?.substring(0, 8) || 'Not set'}...<br/>
                  <strong>Dataset ID:</strong> {report.datasetId?.substring(0, 8) || 'Not set'}...<br/>
                  <strong>Core Dataset ID:</strong> {report.coreDatasetId?.substring(0, 8) || 'Not set'}...
                </p>
                
                {/* View report button with conditional enabling */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleViewReport(report)}
                  disabled={!report.isActive || generatingEmbed || !report.reportId || !report.datasetId || !report.coreDatasetId}
                  className="d-flex align-items-center"
                >
                  <Eye size={14} className="me-1" />
                  {generatingEmbed ? 'Generating...' : 'View Report'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Empty state display */}
      {reports.length === 0 && !loading && (
        <div className="text-center py-5">
          <p className="text-muted">No reports found.</p>
        </div>
      )}
    </>
  );
};

export default AdminReportsViewer;
