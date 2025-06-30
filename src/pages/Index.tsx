
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AuthComponent from '../components/AuthComponent';
import Dashboard from '../components/Dashboard';
import AdminDashboard from '../components/AdminDashboard';

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

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);

        if (!decoded.email || !decoded.department) {
          throw new Error('Invalid token payload');
        }

        const userFromToken: User = {
          email: decoded.email,
          department: decoded.department,
          isAdmin: decoded.isAdmin || false
        };

        setUser(userFromToken);
        localStorage.setItem('user', JSON.stringify(userFromToken));
        localStorage.setItem('jwt_token', token);

        // Clean URL after storing
        window.history.replaceState({}, '', '/');
      } catch (err) {
        console.error('Failed to decode JWT:', err);
      }
    } else {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    // Make sure to preserve the isAdmin flag when logging in
    const userWithAdmin = {
      ...userData,
      isAdmin: userData.isAdmin || false
    };
    setUser(userWithAdmin);
    localStorage.setItem('user', JSON.stringify(userWithAdmin));
    console.log('User logged in:', userWithAdmin);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('jwt_token');
    console.log('User logged out');
  };

  return (
    <>
      {user ? (
        user.isAdmin ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )
      ) : (
        <AuthComponent onLogin={handleLogin} />
      )}
    </>
  );
};

export default Index;
