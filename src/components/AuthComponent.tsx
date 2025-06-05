
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Phone, Mail, Lock } from 'lucide-react';

interface AuthComponentProps {
  onLogin: (user: { email: string; department: string }) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    department: 'Finance'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departments = ['Finance', 'IT', 'HR', 'Sales', 'Marketing', 'Operations'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      try {
        if (loginType === 'email' && !formData.email) {
          throw new Error('Email is required');
        }
        if (loginType === 'phone' && !formData.phone) {
          throw new Error('Phone number is required');
        }
        if (!formData.password) {
          throw new Error('Password is required');
        }

        // Simulate successful login
        onLogin({
          email: formData.email || formData.phone,
          department: formData.department
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

              <Form onSubmit={handleSubmit}>
                <div className="mb-3">
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
                  </div>

                  {loginType === 'email' ? (
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
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

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Department</Form.Label>
                    <Form.Select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </Form.Select>
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
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthComponent;
