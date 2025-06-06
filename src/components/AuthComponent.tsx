
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Phone, Mail, Lock } from 'lucide-react';

interface AuthComponentProps {
  onLogin: (user: { email: string; department: string }) => void;
}

// Sample database simulation
const userDatabase = [
  { email: 'name1@gmail.com', department: 'IT', password: 'password123' },
  { email: 'name2@gmail.com', department: 'Sales', password: 'password123' },
  { email: 'bhavya.khatri@gmail.com', department: 'Finance', password: 'password123' },
  { email: 'john.doe@company.com', department: 'HR', password: 'password123' },
  { email: 'sarah.wilson@company.com', department: 'Marketing', password: 'password123' },
  { email: 'mike.johnson@company.com', department: 'Operations', password: 'password123' }
];

const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  const [loginType, setLoginType] = useState<'email' | 'phone' | 'sso'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      try {
        if (loginType === 'sso') {
          // Simulate SSO login - automatically pick a user for demo
          const randomUser = userDatabase[Math.floor(Math.random() * userDatabase.length)];
          onLogin({
            email: randomUser.email,
            department: randomUser.department
          });
          return;
        }

        if (loginType === 'email' && !formData.email) {
          throw new Error('Email is required');
        }
        if (loginType === 'phone' && !formData.phone) {
          throw new Error('Phone number is required');
        }
        if (!formData.password) {
          throw new Error('Password is required');
        }

        // Check against sample database
        if (loginType === 'email') {
          const user = userDatabase.find(u => u.email === formData.email && u.password === formData.password);
          if (!user) {
            throw new Error('Invalid email or password');
          }
          onLogin({
            email: user.email,
            department: user.department
          });
        } else {
          // For phone login, simulate with first user
          const user = userDatabase[0];
          onLogin({
            email: formData.phone,
            department: user.department
          });
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSSOLogin = () => {
    setLoading(true);
    setError('');
    
    // Simulate SSO authentication
    setTimeout(() => {
      const randomUser = userDatabase[Math.floor(Math.random() * userDatabase.length)];
      onLogin({
        email: randomUser.email,
        department: randomUser.department
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <Container fluid className="app-container d-flex align-items-center justify-content-center p-4">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="auth-card p-4">
            <Card.Body>
              <div className="text-center mb-4">
                <User size={60} className="text-primary mb-3" />
                <h2 className="fw-bold text-primary">Business Portal</h2>
                <p className="text-muted">Access your department dashboard</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <div className="mb-4">
                <div className="d-flex gap-2 mb-3">
                  <Button
                    variant={loginType === 'email' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setLoginType('email')}
                    className="flex-1"
                  >
                    <Mail size={16} className="me-1" />
                    Email
                  </Button>
                  <Button
                    variant={loginType === 'phone' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setLoginType('phone')}
                    className="flex-1"
                  >
                    <Phone size={16} className="me-1" />
                    Phone
                  </Button>
                  <Button
                    variant={loginType === 'sso' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setLoginType('sso')}
                    className="flex-1"
                  >
                    <Lock size={16} className="me-1" />
                    SSO
                  </Button>
                </div>

                {loginType === 'sso' ? (
                  <div className="text-center">
                    <p className="text-muted mb-3">Single Sign-On Authentication</p>
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100"
                      onClick={handleSSOLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            className="me-2"
                          />
                          Authenticating...
                        </>
                      ) : (
                        'Login with SSO'
                      )}
                    </Button>
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    {loginType === 'email' ? (
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Try: bhavya.khatri@gmail.com"
                          required
                        />
                      </Form.Group>
                    ) : (
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          required
                        />
                      </Form.Group>
                    )}

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Try: password123"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100 btn-custom"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            className="me-2"
                          />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <Lock size={18} className="me-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </Form>
                )}
              </div>

              <div className="text-center mt-3">
                <small className="text-muted">
                  Demo credentials: bhavya.khatri@gmail.com / password123
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthComponent;
