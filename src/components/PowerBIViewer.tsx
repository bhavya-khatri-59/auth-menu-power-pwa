
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
        data: generateMockChartData(menu.id),
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

  // Generate mock data based on report type
  const generateMockChartData = (menuId: string) => {
    const baseData = {
      'financial-overview': {
        revenue: 2500000,
        expenses: 1800000,
        profit: 700000,
        growth: '+12.5%'
      },
      'budget-analysis': {
        budgetUtilization: 78,
        departments: ['Finance', 'IT', 'HR', 'Sales'],
        spending: [850000, 650000, 420000, 780000]
      },
      'system-performance': {
        uptime: 99.8,
        responseTime: 142,
        activeUsers: 1247,
        incidents: 3
      },
      'sales-performance': {
        monthlyRevenue: 450000,
        target: 500000,
        conversion: 24.5,
        deals: 89
      }
    };

    return baseData[menuId as keyof typeof baseData] || {
      value: Math.floor(Math.random() * 1000000),
      percentage: Math.floor(Math.random() * 100),
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  };

  useEffect(() => {
    fetchPowerBIReport(menu.powerBIReportId);
  }, [menu.powerBIReportId]);

  const handleRefresh = () => {
    fetchPowerBIReport(menu.powerBIReportId);
  };

  const renderMockVisualization = () => {
    if (!reportData) return null;

    return (
      <div className="mt-4">
        <Row className="g-4">
          <Col xs={12} md={6} lg={3}>
            <Card className="text-center p-3 border-0 bg-primary text-white">
              <h3 className="fw-bold">
                {typeof reportData.data.revenue !== 'undefined' 
                  ? `$${(reportData.data.revenue / 1000000).toFixed(1)}M`
                  : typeof reportData.data.uptime !== 'undefined'
                  ? `${reportData.data.uptime}%`
                  : typeof reportData.data.monthlyRevenue !== 'undefined'
                  ? `$${(reportData.data.monthlyRevenue / 1000).toFixed(0)}K`
                  : reportData.data.value
                }
              </h3>
              <p className="mb-0 opacity-75">
                {menu.id.includes('financial') ? 'Revenue' 
                : menu.id.includes('system') ? 'Uptime'
                : menu.id.includes('sales') ? 'Monthly Revenue'
                : 'Primary Metric'}
              </p>
            </Card>
          </Col>
          
          <Col xs={12} md={6} lg={3}>
            <Card className="text-center p-3 border-0 bg-success text-white">
              <h3 className="fw-bold">
                {typeof reportData.data.profit !== 'undefined'
                  ? `$${(reportData.data.profit / 1000000).toFixed(1)}M`
                  : typeof reportData.data.activeUsers !== 'undefined'
                  ? reportData.data.activeUsers.toLocaleString()
                  : typeof reportData.data.conversion !== 'undefined'
                  ? `${reportData.data.conversion}%`
                  : `${reportData.data.percentage}%`
                }
              </h3>
              <p className="mb-0 opacity-75">
                {menu.id.includes('financial') ? 'Profit'
                : menu.id.includes('system') ? 'Active Users'
                : menu.id.includes('sales') ? 'Conversion Rate'
                : 'Secondary Metric'}
              </p>
            </Card>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <Card className="text-center p-3 border-0 bg-warning text-white">
              <h3 className="fw-bold">
                {typeof reportData.data.growth !== 'undefined'
                  ? reportData.data.growth
                  : typeof reportData.data.responseTime !== 'undefined'
                  ? `${reportData.data.responseTime}ms`
                  : typeof reportData.data.target !== 'undefined'
                  ? `$${(reportData.data.target / 1000).toFixed(0)}K`
                  : '85%'}
              </h3>
              <p className="mb-0 opacity-75">
                {menu.id.includes('financial') ? 'Growth'
                : menu.id.includes('system') ? 'Response Time'
                : menu.id.includes('sales') ? 'Target'
                : 'Growth Rate'}
              </p>
            </Card>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <Card className="text-center p-3 border-0 bg-info text-white">
              <h3 className="fw-bold">
                {typeof reportData.data.expenses !== 'undefined'
                  ? `$${(reportData.data.expenses / 1000000).toFixed(1)}M`
                  : typeof reportData.data.incidents !== 'undefined'
                  ? reportData.data.incidents
                  : typeof reportData.data.deals !== 'undefined'
                  ? reportData.data.deals
                  : '342'}
              </h3>
              <p className="mb-0 opacity-75">
                {menu.id.includes('financial') ? 'Expenses'
                : menu.id.includes('system') ? 'Incidents'
                : menu.id.includes('sales') ? 'Deals Closed'
                : 'Total Items'}
              </p>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <Card className="p-4">
              <h5 className="fw-bold mb-3">Interactive Power BI Report</h5>
              <div 
                className="bg-light rounded p-5 text-center"
                style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                    Last Updated: {new Date(reportData.lastUpdated).toLocaleString()}
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
        renderMockVisualization()
      )}
    </>
  );
};

export default PowerBIViewer;
