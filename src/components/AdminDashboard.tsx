
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { LogOut, Shield, FileText, Users, Activity, Building, Eye } from 'lucide-react';
import AdminReportsEditor from './AdminReportsEditor';
import AdminDepartmentManager from './AdminDepartmentManager';
import AdminReportsViewer from './AdminReportsViewer';
import { API_ENDPOINTS } from '../config/api';

interface User {
  email: string;
  department: string;
  isAdmin?: boolean;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface AdminStats {
  totalUsers: number;
  totalReports: number;
  activeReports: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminStats, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar className="navbar-custom" expand="lg" variant="dark">
        <Container fluid>
          <Navbar.Brand className="fw-bold d-flex align-items-center">
            <Shield size={20} className="me-2" />
            Admin Portal
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
              Admin Dashboard
            </h2>
            <p className="text-muted">
              Manage reports, departments, and PowerBI configurations
            </p>
          </Col>
        </Row>

        {/* Admin Summary Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center p-3 bg-primary text-white">
              <Card.Body>
                <FileText size={32} className="mb-2" />
                <h4 className="fw-bold">{loading ? '...' : stats?.totalReports || 0}</h4>
                <p className="mb-0">Total Reports</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center p-3 bg-success text-white">
              <Card.Body>
                <Activity size={32} className="mb-2" />
                <h4 className="fw-bold">{loading ? '...' : stats?.activeReports || 0}</h4>
                <p className="mb-0">Active Reports</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center p-3 bg-info text-white">
              <Card.Body>
                <Users size={32} className="mb-2" />
                <h4 className="fw-bold">{loading ? '...' : stats?.totalUsers || 0}</h4>
                <p className="mb-0">Total Users</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="p-4">
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
                <Tab eventKey="overview" title={<span><FileText size={16} className="me-1" />Reports Management</span>}>
                  <AdminReportsEditor onStatsUpdate={fetchAdminStats} />
                </Tab>
                <Tab eventKey="departments" title={<span><Building size={16} className="me-1" />Departments</span>}>
                  <AdminDepartmentManager onDepartmentChange={fetchAdminStats} />
                </Tab>
                <Tab eventKey="viewer" title={<span><Eye size={16} className="me-1" />View Reports</span>}>
                  <AdminReportsViewer />
                </Tab>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
