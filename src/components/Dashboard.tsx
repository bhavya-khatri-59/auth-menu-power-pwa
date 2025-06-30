
import React, { useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Spinner, Alert } from 'react-bootstrap';
import { 
  LogOut,
  Menu as MenuIcon,
  FileText,
} from 'lucide-react';
import PowerBIViewer from './PowerBIViewer';
import ReportIcon from './ReportIcon';
import { useReports } from '../hooks/useReports';

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
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [selectedMenu, setSelectedMenu] = useState<MenuOption | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { data: reports = [], isLoading, error } = useReports(user.department);

  // Filter active reports for regular users
  const activeReports = reports.filter(report => report.isActive !== false);

  const handleMenuClick = (menu: MenuOption) => {
    setSelectedMenu(menu);
    setShowMobileMenu(false);
  };

  const handleBackToMenu = () => {
    setSelectedMenu(null);
  };

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
        {!selectedMenu ? (
          <>
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

            {/* Summary Cards */}
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

            {isLoading ? (
              <Row>
                <Col className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading reports...</p>
                </Col>
              </Row>
            ) : error ? (
              <Row>
                <Col>
                  <Alert variant="danger">
                    <h6>Error Loading Reports</h6>
                    Failed to load reports for {user.department} department. Please try again.
                  </Alert>
                </Col>
              </Row>
            ) : (
              <Row className="g-4">
                {activeReports.map((menu) => (
                  <Col key={menu.id} xs={12} sm={6} lg={4}>
                    <Card 
                      className="menu-card h-100 p-3"
                      onClick={() => handleMenuClick(menu)}
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
          </>
        ) : (
          <PowerBIViewer 
            menu={selectedMenu} 
            onBack={handleBackToMenu}
          />
        )}
      </Container>
    </div>
  );
};

export default Dashboard;
