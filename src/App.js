import React, { useState, useContext } from 'react';
import LoginPage from './components/LoginPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import './index.css';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);

  const handleLogin = (user) => {
    setCurrentUser(user);
    console.log("START")
    // Store user in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  React.useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  React.useEffect(() => {
    let logoutTimer;

    if (currentUser) {
      // Set a timer for 10 hours (in milliseconds)
      const timeout = 10 * 60 * 60 * 1000;
      logoutTimer = setTimeout(() => {
        handleLogout();
      }, timeout);
    }

    // Clear the timer if the component unmounts or the user logs out
    return () => {
      clearTimeout(logoutTimer);
    };
  }, [currentUser, handleLogout]);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="App">
      {currentUser ? (
        <EmployeeDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
