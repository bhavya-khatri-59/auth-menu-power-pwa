
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Shield, Mail, Lock } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface AuthComponentProps {
  onLogin: (user: { email: string; department: string; isAdmin?: boolean }) => void;
}

/**
 * AuthComponent handles user authentication with support for:
 * - SSO (Single Sign-On) authentication
 * - Manual email/password login for admins
 * - Token-based authentication via URL parameters
 */
const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  // State management for login type and form data
  const [loginType, setLoginType] = useState<'email' | 'phone' | 'sso'>('sso');
  const [formData, setFormData] = useState({ email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Effect to handle SSO token authentication from URL parameters
   * Automatically logs in user if valid token is present in URL
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      try {
        // Store token and decode user information
        localStorage.setItem('jwt_token', token);
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const user = {
          email: decoded.email,
          department: decoded.department,
          isAdmin: decoded.isAdmin || false
        };
        onLogin(user);
        localStorage.setItem('user', JSON.stringify(user));
        // Clean up URL after successful authentication
        window.history.replaceState({}, document.title, '/');
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }
  }, [onLogin]);

  /**
   * Handles manual login form submission for admin users
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { email, phone, password } = formData;
      const identifier = loginType === 'email' ? email : phone;

      // Validate required fields
      if (!identifier || !password) throw new Error(`${loginType === 'email' ? 'Email' : 'Phone'} and password are required`);

      // Mock credentials for testing
      const mockCredentials = [
        { email: 'admin@test.com', password: 'admin123', department: 'Admin', isAdmin: true },
        { email: 'user@test.com', password: 'user123', department: 'Sales', isAdmin: false },
      ];

      // Check if mock credentials are used
      const mockUser = mockCredentials.find(
        cred => cred.email.toLowerCase() === identifier.toLowerCase() && cred.password === password
      );

      if (mockUser) {
        // Create mock token and user
        const user = {
          email: mockUser.email,
          department: mockUser.department,
          isAdmin: mockUser.isAdmin
        };
        const mockToken = `mock.${btoa(JSON.stringify(user))}.token`;
        
        localStorage.setItem('jwt_token', mockToken);
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user);
        return;
      }

      // Send login request to backend
      const res = await fetch(API_ENDPOINTS.manualLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [loginType]: identifier, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Login failed');
      }

      // Process successful login response
      const { token } = await res.json();
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const user = {
        email: decoded.email,
        department: decoded.department,
        isAdmin: decoded.isAdmin || false
      };

      // Store authentication data and trigger login callback
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles input changes for form fields
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Initiates SSO login flow by redirecting to SSO provider
   */
  const handleSSOLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Get SSO login URL from backend
      const res = await fetch(API_ENDPOINTS.loginUrl);
      const data = await res.json();
      // Redirect to SSO provider
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
              {/* Centered header with user icon */}
              <div className="text-center mb-2">
                <div className="d-flex justify-content-center align-items-center mb-2">
                  <User size={60} className="text-primary" />
                </div>
                <h2 className="fw-bold text-primary">Business Portal</h2>
                <p className="text-muted">Access your department dashboard</p>
              </div>

              {/* Error display */}
              {error && <Alert variant="danger">{error}</Alert>}

              {/* Login method selection and forms */}
              <div className="mb-4">
                {/* Login type toggle buttons */}
                <div className="d-flex gap-2 mb-2">
                  <Button variant={loginType === 'sso' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setLoginType('sso')} className="flex-1">
                    <Lock size={16} className="me-1" /> SSO
                  </Button>
                  <Button variant={loginType === 'email' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setLoginType('email')} className="flex-1">
                    <Shield size={16} className="me-1" /> Admin
                  </Button>
                </div>

                {/* SSO Login Section */}
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
                  // Manual login form for admin users
                  <Form onSubmit={handleSubmit}>
                    {/* Test credentials info */}
                    <Alert variant="info" className="mb-3 py-2">
                      <small>
                        <strong>Test Credentials:</strong><br />
                        Admin: admin@test.com / admin123<br />
                        User: user@test.com / user123
                      </small>
                    </Alert>

                    {/* Email input for admin login */}
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
                    {/* Phone input (legacy support) */}
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

                    {/* Password input */}
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

                    {/* Submit button */}
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
