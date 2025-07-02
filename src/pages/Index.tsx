
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AuthComponent from '../components/AuthComponent';
import Dashboard from '../components/Dashboard';
import AdminDashboard from '../components/AdminDashboard';

// Type definitions for user and JWT token structure
interface User {
  email: string;
  department: string;
  isAdmin?: boolean;
}

interface DecodedToken {
  email: string;
  department: string;
  isAdmin?: boolean;
  exp?: number;
}

/**
 * Index Component - Main application entry point and routing logic
 * 
 * Responsibilities:
 * - JWT token validation and user authentication state management
 * - Routing between authentication, user dashboard, and admin dashboard
 * - Persistent login state management using localStorage
 * - Token-based authentication from URL parameters (SSO flow)
 */
const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  /**
   * Effect hook for handling authentication state initialization
   * Processes JWT tokens from URL parameters or localStorage
   */
  useEffect(() => {
    // Check for SSO token in URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      try {
        // Decode and validate JWT token from SSO redirect
        const decoded = jwtDecode<DecodedToken>(token);

        // Validate required token payload fields
        if (!decoded.email || !decoded.department) {
          throw new Error('Invalid token payload');
        }

        // Create user object from token payload
        const userFromToken: User = {
          email: decoded.email,
          department: decoded.department,
          isAdmin: decoded.isAdmin || false
        };

        // Store user data and token for persistent authentication
        setUser(userFromToken);
        localStorage.setItem('user', JSON.stringify(userFromToken));
        localStorage.setItem('jwt_token', token);

        // Clean URL after processing token to improve UX
        window.history.replaceState({}, '', '/');
      } catch (err) {
        console.error('Failed to decode JWT:', err);
      }
    } else {
      // Attempt to restore user session from localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  /**
   * Handles successful user login from AuthComponent
   * @param userData - User information from authentication process
   */
  const handleLogin = (userData: User) => {
    // Ensure admin flag is preserved during login
    const userWithAdmin = {
      ...userData,
      isAdmin: userData.isAdmin || false
    };
    setUser(userWithAdmin);
    localStorage.setItem('user', JSON.stringify(userWithAdmin));
    console.log('User logged in:', userWithAdmin);
  };

  /**
   * Handles user logout and cleanup
   * Clears all stored authentication data
   */
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('jwt_token');
    console.log('User logged out');
  };

  // Conditional rendering based on authentication state and user role
  return (
    <>
      {user ? (
        // Route to appropriate dashboard based on user role
        user.isAdmin ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )
      ) : (
        // Show authentication component for unauthenticated users
        <AuthComponent onLogin={handleLogin} />
      )}
    </>
  );
};

export default Index;
