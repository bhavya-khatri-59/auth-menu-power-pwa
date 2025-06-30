import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Phone, Mail, Lock } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface AuthComponentProps {
  onLogin: (user: { email: string; department: string; isAdmin?: boolean }) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  const [loginType, setLoginType] = useState<'email' | 'phone' | 'sso'>('sso');
  const [formData, setFormData] = useState({ email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      try {
        localStorage.setItem('jwt_token', token);
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const user = {
          email: decoded.email,
          department: decoded.department,
          isAdmin: decoded.isAdmin || false
        };
        onLogin(user);
        localStorage.setItem('user', JSON.stringify(user));
        window.history.replaceState({}, document.title, '/');
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { email, phone, password } = formData;
      const identifier = loginType === 'email' ? email : phone;

      if (!identifier || !password) throw new Error(`${loginType === 'email' ? 'Email' : 'Phone'} and password are required`);

      const res = await fetch(API_ENDPOINTS.manualLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [loginType]: identifier, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Login failed');
      }

      const { token } = await res.json();
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const user = {
        email: decoded.email,
        department: decoded.department,
        isAdmin: decoded.isAdmin || false
      };

      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSSOLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.loginUrl);
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError('Failed to initiate SSO login');
      setLoading(false);
    }
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

              {error && <Alert variant="danger">{error}</Alert>}

              <div className="mb-4">
                <div className="d-flex gap-2 mb-3">
                  <Button variant={loginType === 'email' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setLoginType('email')} className="flex-1">
                    <Mail size={16} className="me-1" /> Email
                  </Button>
                  <Button variant={loginType === 'phone' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setLoginType('phone')} className="flex-1">
                    <Phone size={16} className="me-1" /> Phone
                  </Button>
                  <Button variant={loginType === 'sso' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setLoginType('sso')} className="flex-1">
                    <Lock size={16} className="me-1" /> SSO
                  </Button>
                </div>

                {loginType === 'sso' ? (
                  <div className="text-center">
                    <p className="text-muted mb-3">Single Sign-On Authentication</p>
                    <Button variant="success" size="lg" className="w-100" onClick={handleSSOLogin} disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Redirecting...
                        </>
                      ) : (
                        'Login with SSO'
                      )}
                    </Button>
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    {loginType === 'email' && (
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
                    )}
                    {loginType === 'phone' && (
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
                        placeholder="Enter your password"
                        required
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" size="lg" className="w-100 btn-custom" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <Lock size={18} className="me-2" /> Sign In
                        </>
                      )}
                    </Button>
                  </Form>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthComponent;
