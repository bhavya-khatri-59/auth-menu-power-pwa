
import React, { useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Tab, Tabs } from 'react-bootstrap';
import { LogOut, Shield } from 'lucide-react';
import AdminReportsEditor from './AdminReportsEditor';
import AdminPowerBIEditor from './AdminPowerBIEditor';

interface User {
  email: string;
  department: string;
  isAdmin?: boolean;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
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
              Manage reports and PowerBI configurations for all departments
            </p>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="p-4">
              <Tabs defaultActiveKey="reports" id="admin-tabs">
                <Tab eventKey="reports" title="Reports Management">
                  <div className="mt-4">
                    <AdminReportsEditor />
                  </div>
                </Tab>
                <Tab eventKey="powerbi" title="PowerBI Management">
                  <div className="mt-4">
                    <AdminPowerBIEditor />
                  </div>
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
