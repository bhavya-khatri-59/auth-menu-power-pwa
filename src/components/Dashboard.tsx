
import React, { useState } from 'react';
import { Container, Row, Col, Card, Navbar, Button, Spinner, Alert } from 'react-bootstrap';
import { LogOut, FileText, Maximize2, Minimize2 } from 'lucide-react';
import PowerBIViewer from './PowerBIViewer';
import ReportIcon from './ReportIcon';
import { useReports } from '../hooks/useReports';
import { API_ENDPOINTS } from '../config/api';

interface User {
  email: string;
  department: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface MenuOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
  reportId?: string;
  datasetId?: string;
  coreDatasetId?: string;
  embedUrl?: string;
  embedToken?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MenuOption | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: reports, isLoading: isLoadingReports, error: reportsError } = useReports(user.department);

  // Ensure reports is an array and filter active reports
  const reportsArray = Array.isArray(reports) ? reports : [];
  const activeReports = reportsArray.filter(report => report.isActive !== false);

  const generateEmbedToken = async (report: MenuOption) => {
    if (!report.reportId || !report.datasetId || !report.coreDatasetId) {
      throw new Error('Missing PowerBI configuration: reportId, datasetId, or coreDatasetId');
    }

    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_ENDPOINTS.generateEmbed}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reportId: report.reportId,
        datasetId: report.datasetId,
        coreDatasetId: report.coreDatasetId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate embed token');
    }

    return await response.json();
  };

  const handleMenuClick = async (menuId: string) => {
    const report = reportsArray.find(r => r.id === menuId);
    if (!report) return;

    setSelectedMenuId(menuId);
    setIsLoadingEmbed(true);
    setEmbedError('');

    try {
      // Generate fresh embed token and URL
      const { embedToken, embedUrl } = await generateEmbedToken(report);
      
      // Create updated report with fresh embed details
      const updatedReport = {
        ...report,
        embedToken,
        embedUrl
      };
      
      setSelectedReport(updatedReport);
    } catch (error) {
      console.error('Error generating embed token:', error);
      setEmbedError((error as Error).message);
      setSelectedMenuId(null);
    } finally {
      setIsLoadingEmbed(false);
    }
  };

  const handleBackToMenu = () => {
    setSelectedMenuId(null);
    setSelectedReport(null);
    setIsFullscreen(false);
    setEmbedError('');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (selectedMenuId && selectedReport) {
    return (
      <div className={`app-container ${isFullscreen ? 'position-fixed top-0 start-0 w-100 h-100 bg-white' : ''}`} style={{ zIndex: isFullscreen ? 9999 : 'auto' }}>
        <Navbar className="navbar-custom" expand="lg" variant="dark">
          <Container fluid>
            <Navbar.Brand className="fw-bold">
              {selectedReport.title}
            </Navbar.Brand>
            
            <div className="d-flex align-items-center gap-2">
              
              <Button
                variant="outline-light"
                size="sm"
                onClick={handleBackToMenu}
                className="d-flex align-items-center"
              >
                ← Back
              </Button>
            </div>
          </Container>
        </Navbar>

        <Container fluid className="p-4 h-100">
          {isLoadingEmbed ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading Power BI report...</p>
            </div>
          ) : embedError ? (
            <Alert variant="danger">
              <h6>Error Loading Report</h6>
              <p>{embedError}</p>
              <Button variant="outline-danger" size="sm" onClick={handleBackToMenu}>
                Back to Reports
              </Button>
            </Alert>
          ) : (
            <PowerBIViewer 
              menu={{
                ...selectedReport,
                icon: <span>{selectedReport.icon}</span>
              }}
              onBack={handleBackToMenu}
            />
          )}
        </Container>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar className="navbar-custom" expand="lg" variant="dark">
        <Container fluid>
          <Navbar.Brand className="fw-bold">
            Business Portal - {user.department}
          </Navbar.Brand>
          
          <div className="d-flex align-items-center">
            <span className="text-white me-3 d-none d-md-inline">
              {user.email}
            </span>
            <Button
              variant="outline-light"
              size="sm"
              onClick={onLogout}
              className="d-flex align-items-center"
            >
              <LogOut size={16} className="me-1" />
              <span className="d-none d-md-inline">Logout</span>
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container fluid className="p-4">
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-primary mb-3">
              Welcome to {user.department} Dashboard
            </h2>
            <p className="text-muted">
              Select a report to view your Power BI analytics
            </p>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center p-3 bg-primary text-white">
              <Card.Body>
                <FileText size={32} className="mb-2" />
                <h4 className="fw-bold">{activeReports.length}</h4>
                <p className="mb-0">Available Reports</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {isLoadingReports ? (
          <Row>
            <Col className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading reports...</p>
            </Col>
          </Row>
        ) : reportsError ? (
          <Row>
            <Col>
              <Alert variant="danger">
                <h6>Error Loading Reports</h6>
                <p>{reportsError.message}</p>
              </Alert>
            </Col>
          </Row>
        ) : (
          <Row className="g-4">
            {activeReports.map((menu) => (
              <Col key={menu.id} xs={12} sm={6} lg={4}>
                <Card 
                  className="menu-card h-100 p-3"
                  onClick={() => handleMenuClick(menu.id)}
                >
                  <Card.Body className="text-center">
                    <ReportIcon iconName={menu.icon} />
                    <h5 className="fw-bold mb-2">{menu.title}</h5>
                    <p className="text-muted small mb-0">
                      {menu.description}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;
