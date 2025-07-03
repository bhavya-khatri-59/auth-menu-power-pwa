import React, { useState } from 'react';
import { Container, Row, Col, Card, Navbar, Button, Spinner, Alert } from 'react-bootstrap';
import { LogOut, FileText, Maximize2, Minimize2 } from 'lucide-react';
import PowerBIViewer from './PowerBIViewer';
import ReportIcon from './ReportIcon';
import { useReports } from '../hooks/useReports';
import { API_ENDPOINTS } from '../config/api';

// Interface definitions for type safety
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
  sharedDatasetId?: string;
  embedUrl?: string;
  embedToken?: string;
}

/**
 * Dashboard Component - Main user interface for accessing department-specific PowerBI reports
 * 
 * Features:
 * - Displays reports filtered by user's department
 * - Generates dynamic PowerBI embed tokens for secure access
 * - Provides fullscreen viewing capabilities
 * - Shows report statistics and navigation
 */
const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // State management for report viewing and UI
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MenuOption | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch reports data using custom hook
  const { data: reports, isLoading: isLoadingReports, error: reportsError } = useReports(user.department);

  // Ensure reports is an array and filter active reports
  const reportsArray = Array.isArray(reports) ? reports : [];
  const activeReports = reportsArray.filter(report => report.isActive !== false);

  /**
   * Generates fresh PowerBI embed token and URL for secure report access
   * @param report - Report configuration containing PowerBI IDs
   * @returns Promise with embedToken and embedUrl
   */
  const generateEmbedToken = async (report: MenuOption) => {
    // Validate required PowerBI configuration
    if (!report.reportId || !report.datasetId) {
      throw new Error('Missing PowerBI configuration: reportId or datasetId');
    }

    const token = localStorage.getItem('jwt_token');
    
    const requestBody: any = {
      reportId: report.reportId,
      datasetId: report.datasetId
    };
    
    // Only include sharedDatasetId if it exists
    if (report.sharedDatasetId) {
      requestBody.sharedDatasetId = report.sharedDatasetId;
    }
    
    const response = await fetch(`${API_ENDPOINTS.generateEmbed}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate embed token');
    }

    return await response.json();
  };

  /**
   * Handles report selection and PowerBI embed token generation
   * @param menuId - ID of the selected report
   */
  const handleMenuClick = async (menuId: string) => {
    const report = reportsArray.find(r => r.id === menuId);
    if (!report) return;

    setSelectedMenuId(menuId);
    setIsLoadingEmbed(true);
    setEmbedError('');

    try {
      // Generate fresh embed token and URL for security
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

  /**
   * Returns to main dashboard from report view
   */
  const handleBackToMenu = () => {
    setSelectedMenuId(null);
    setSelectedReport(null);
    setIsFullscreen(false);
    setEmbedError('');
  };

  /**
   * Toggles fullscreen mode for report viewing
   */
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render PowerBI report viewer when report is selected
  if (selectedMenuId && selectedReport) {
    return (
      <div className={`app-container ${isFullscreen ? 'position-fixed top-0 start-0 w-100 h-100 bg-white' : ''}`} style={{ zIndex: isFullscreen ? 9999 : 'auto' }}>
        {/* Report viewer navigation bar */}
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

        {/* Report content area */}
        <Container fluid className="p-4 h-100">
          {isLoadingEmbed ? (
            // Loading state while generating embed token
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading Power BI report...</p>
            </div>
          ) : embedError ? (
            // Error state for embed token generation failures
            <Alert variant="danger">
              <h6>Error Loading Report</h6>
              <p>{embedError}</p>
              <Button variant="outline-danger" size="sm" onClick={handleBackToMenu}>
                Back to Reports
              </Button>
            </Alert>
          ) : (
            // PowerBI report viewer component
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

  // Main dashboard view
  return (
    <div className="app-container">
      {/* Main navigation bar */}
      <Navbar className="navbar-custom" expand="lg" variant="dark">
        <Container fluid>
          <Navbar.Brand className="fw-bold">
            Business Portal - {user.department}
          </Navbar.Brand>
          
          {/* User info and logout */}
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
        {/* Welcome header */}
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

        {/* Dashboard statistics */}
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

        {/* Reports loading and error states */}
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
          // Reports grid display
          <Row className="g-4">
            {activeReports.map((menu) => (
              <Col key={menu.id} xs={12} sm={6} lg={4}>
                <Card 
                  className="menu-card h-100 p-3"
                  onClick={() => handleMenuClick(menu.id)}
                >
                  <Card.Body className="text-center">
                    {/* Report icon */}
                    <ReportIcon iconName={menu.icon} />
                    {/* Report title and description */}
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
