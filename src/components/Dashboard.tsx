
import React, { useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button } from 'react-bootstrap';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Monitor, 
  Shield, 
  TrendingUp, 
  LogOut,
  Menu as MenuIcon,
  Database,
  LineChart
} from 'lucide-react';
import PowerBIViewer from './PowerBIViewer';

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
  icon: React.ReactNode;
  powerBIReportId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [selectedMenu, setSelectedMenu] = useState<MenuOption | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const departmentMenus: Record<string, MenuOption[]> = {
    Finance: [
      {
        id: 'financial-overview',
        title: 'Financial Overview',
        description: 'Revenue, expenses, and profit analysis',
        icon: <DollarSign className="department-icon text-success" />,
        powerBIReportId: 'finance-overview-001'
      },
      {
        id: 'budget-analysis',
        title: 'Budget Analysis',
        description: 'Budget vs actual spending reports',
        icon: <BarChart3 className="department-icon text-primary" />,
        powerBIReportId: 'budget-analysis-002'
      },
      {
        id: 'financial-forecasting',
        title: 'Financial Forecasting',
        description: 'Predictive financial models and trends',
        icon: <TrendingUp className="department-icon text-warning" />,
        powerBIReportId: 'forecast-003'
      }
    ],
    IT: [
      {
        id: 'system-performance',
        title: 'System Performance',
        description: 'Server uptime and performance metrics',
        icon: <Monitor className="department-icon text-info" />,
        powerBIReportId: 'system-perf-001'
      },
      {
        id: 'security-dashboard',
        title: 'Security Dashboard',
        description: 'Security incidents and threat analysis',
        icon: <Shield className="department-icon text-danger" />,
        powerBIReportId: 'security-dash-002'
      },
      {
        id: 'user-analytics',
        title: 'User Analytics',
        description: 'User activity and system usage',
        icon: <Users className="department-icon text-primary" />,
        powerBIReportId: 'user-analytics-003'
      }
    ],
    HR: [
      {
        id: 'employee-metrics',
        title: 'Employee Metrics',
        description: 'Headcount, turnover, and satisfaction',
        icon: <Users className="department-icon text-primary" />,
        powerBIReportId: 'hr-metrics-001'
      },
      {
        id: 'recruitment-analytics',
        title: 'Recruitment Analytics',
        description: 'Hiring pipeline and source analysis',
        icon: <TrendingUp className="department-icon text-success" />,
        powerBIReportId: 'recruitment-002'
      }
    ],
    Sales: [
      {
        id: 'sales-performance',
        title: 'Sales Performance',
        description: 'Revenue, targets, and team performance',
        icon: <TrendingUp className="department-icon text-success" />,
        powerBIReportId: 'sales-perf-001'
      },
      {
        id: 'customer-analytics',
        title: 'Customer Analytics',
        description: 'Customer acquisition and retention',
        icon: <Users className="department-icon text-info" />,
        powerBIReportId: 'customer-002'
      }
    ],
    Marketing: [
      {
        id: 'campaign-performance',
        title: 'Campaign Performance',
        description: 'Marketing ROI and campaign effectiveness',
        icon: <BarChart3 className="department-icon text-warning" />,
        powerBIReportId: 'marketing-001'
      },
      {
        id: 'digital-analytics',
        title: 'Digital Analytics',
        description: 'Website traffic and social media metrics',
        icon: <Monitor className="department-icon text-primary" />,
        powerBIReportId: 'digital-002'
      }
    ],
    Operations: [
      {
        id: 'operational-efficiency',
        title: 'Operational Efficiency',
        description: 'Process metrics and productivity analysis',
        icon: <BarChart3 className="department-icon text-info" />,
        powerBIReportId: 'operations-001'
      },
      {
        id: 'supply-chain',
        title: 'Supply Chain',
        description: 'Inventory and logistics performance',
        icon: <TrendingUp className="department-icon text-success" />,
        powerBIReportId: 'supply-chain-002'
      }
    ],
    'Data and BI': [
      {
        id: 'data-warehouse',
        title: 'Data Warehouse Overview',
        description: 'Data pipeline health and ETL monitoring',
        icon: <Database className="department-icon text-primary" />,
        powerBIReportId: 'data-warehouse-001'
      },
      {
        id: 'bi-reports',
        title: 'BI Reports Dashboard',
        description: 'Business intelligence reports and KPIs',
        icon: <BarChart3 className="department-icon text-success" />,
        powerBIReportId: 'bi-reports-002'
      },
      {
        id: 'analytics-trends',
        title: 'Analytics & Trends',
        description: 'Advanced analytics and trend analysis',
        icon: <LineChart className="department-icon text-warning" />,
        powerBIReportId: 'analytics-trends-003'
      }
    ]
  };

  const currentMenus = departmentMenus[user.department] || [];

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

            <Row className="g-4">
              {currentMenus.map((menu) => (
                <Col key={menu.id} xs={12} sm={6} lg={4}>
                  <Card 
                    className="menu-card h-100 p-3"
                    onClick={() => handleMenuClick(menu)}
                  >
                    <Card.Body className="text-center">
                      {menu.icon}
                      <h5 className="fw-bold mb-2">{menu.title}</h5>
                      <p className="text-muted small mb-0">
                        {menu.description}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
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
