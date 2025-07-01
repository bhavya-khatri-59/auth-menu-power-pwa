
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Eye, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import PowerBIViewer from './PowerBIViewer';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
  clientId?: string;
  reportId?: string;
  embedUrl?: string;
  embedToken?: string;
  tenantId?: string;
  isActive: boolean;
  department: string;
}

const AdminReportsViewer: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchAllReports();
  }, []);

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
      
      // Handle the response structure properly - data.reports should be the flattened array
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

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Row className="g-3">
        {reports.map((report) => (
          <Col key={`${report.department}-${report.id}`} md={6} lg={4}>
            <Card className={`h-100 ${!report.isActive ? 'opacity-50' : ''}`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold">{report.title}</h6>
                  <div className="d-flex gap-1">
                    <Badge bg={report.isActive ? 'success' : 'secondary'}>
                      {report.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <Badge bg="primary" className="mb-2">{report.department}</Badge>
                <p className="text-muted small mb-2">{report.description}</p>
                <p className="text-muted small mb-3">
                  <strong>PowerBI ID:</strong> {report.powerBIReportId}<br/>
                  <strong>Report ID:</strong> {report.reportId?.substring(0, 8) || 'Not set'}...<br/>
                  <strong>Client ID:</strong> {report.clientId?.substring(0, 8) || 'Not set'}...
                </p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setSelectedReport(report)}
                  disabled={!report.isActive}
                  className="d-flex align-items-center"
                >
                  <Eye size={14} className="me-1" />
                  View Report
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {reports.length === 0 && !loading && (
        <div className="text-center py-5">
          <p className="text-muted">No reports found.</p>
        </div>
      )}
    </>
  );
};

export default AdminReportsViewer;
