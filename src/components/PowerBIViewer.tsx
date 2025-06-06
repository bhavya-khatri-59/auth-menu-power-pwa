
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface MenuOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  powerBIReportId: string;
}

interface PowerBIViewerProps {
  menu: MenuOption;
  onBack: () => void;
}

const PowerBIViewer: React.FC<PowerBIViewerProps> = ({ menu, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  // Simulate Power BI API call
  const fetchPowerBIReport = async (reportId: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock Power BI API response
      const mockReportData = {
        reportId: reportId,
        title: menu.title,
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}`,
        accessToken: 'mock-access-token',
        lastUpdated: new Date().toISOString()
      };
      
      setReportData(mockReportData);
    } catch (err) {
      setError('Failed to load Power BI report. Please try again.');
      console.error('Power BI API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerBIReport(menu.powerBIReportId);
  }, [menu.powerBIReportId]);

  const handleRefresh = () => {
    fetchPowerBIReport(menu.powerBIReportId);
  };

  const renderPowerBIReport = () => {
    if (!reportData) return null;

    return (
      <div className="mt-4">
        <Row>
          <Col>
            <Card className="p-4">
              <h5 className="fw-bold mb-3">Interactive Power BI Report</h5>
              <div 
                className="bg-light rounded p-5 text-center"
                style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div>
                  <div className="mb-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <h6 className="text-muted">Power BI Report: {menu.title}</h6>
                  <p className="text-muted small">
                    Report ID: {menu.powerBIReportId}<br/>
                    Last Updated: {new Date(reportData.lastUpdated).toLocaleString()}<br/>
                    Embed URL: {reportData.embedUrl}
                  </p>
                  <small className="text-muted">
                    * This is a demo. In production, the actual Power BI embed code would render here.
                  </small>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={onBack}
                className="me-3"
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Menu
              </Button>
              <div>
                <h3 className="fw-bold mb-1">{menu.title}</h3>
                <p className="text-muted mb-0">{menu.description}</p>
              </div>
            </div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className="me-1" />
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Row>
          <Col>
            <Card className="powerbi-container">
              <Card.Body className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <h5>Loading Power BI Report...</h5>
                  <p className="text-muted">Connecting to Power BI API</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : error ? (
        <Row>
          <Col>
            <Alert variant="danger">
              <h6>Error Loading Report</h6>
              {error}
              <div className="mt-2">
                <Button variant="danger" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      ) : (
        renderPowerBIReport()
      )}
    </>
  );
};

export default PowerBIViewer;
