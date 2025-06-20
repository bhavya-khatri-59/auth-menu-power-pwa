import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AuthComponent from '../components/AuthComponent';
import Dashboard from '../components/Dashboard';

interface User {
  email: string;
  department: string;
}

interface DecodedToken {
  email: string;
  department: string;
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
          department: decoded.department
        };

        setUser(userFromToken);
        localStorage.setItem('user', JSON.stringify(userFromToken));

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
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('User logged in:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    console.log('User logged out');
  };

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <AuthComponent onLogin={handleLogin} />
      )}
    </>
  );
};

export default Index;
