import React, { useState } from 'react';
import { User } from './types';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AppProvider } from './context/AppContext';
import NotificationCenter from './components/NotificationCenter';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
        {currentUser ? (
          <>
            <Header user={currentUser} onLogout={handleLogout} />
            <Dashboard currentUser={currentUser} />
          </>
        ) : (
          <Login onLoginSuccess={handleLogin} />
        )}
      </div>
      <NotificationCenter />
    </AppProvider>
  );
};

export default App;