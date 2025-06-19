import React, { useState, useEffect } from 'react';
import AuthComponent from '../components/AuthComponent';
import Dashboard from '../components/Dashboard';

interface User {
  email: string;
  department: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const department = params.get('department');

  if (email && department) {
    const userFromSSO = { email, department };
    setUser(userFromSSO);
    localStorage.setItem('user', JSON.stringify(userFromSSO));
    window.history.replaceState({}, '', '/');
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
