
import React, { useState } from 'react';
import AuthComponent from '../components/AuthComponent';
import Dashboard from '../components/Dashboard';

interface User {
  email: string;
  department: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    console.log('User logged in:', userData);
  };

  const handleLogout = () => {
    setUser(null);
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
