// Fixed App.js - Auto Logout Implementation

import React, { useState, useContext, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import './index.css';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);

  // Use useCallback to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    console.log('User logged out - session expired or manual logout');
  }, []);

  const handleLogin = (user) => {
    const loginTime = Date.now();
    setCurrentUser(user);
    console.log("LOGIN START - Setting timer for 10 hours");
    
    // Store user and login time in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loginTime', loginTime.toString());
  };

  // Check session validity on app load
  React.useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedLoginTime = localStorage.getItem('loginTime');
    
    if (savedUser && savedLoginTime) {
      const loginTime = parseInt(savedLoginTime, 10);
      const currentTime = Date.now();
      const timeElapsed = currentTime - loginTime;
      const tenHours = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
      
      // Check if 10 hours have already passed
      if (timeElapsed >= tenHours) {
        console.log('Session expired - 10 hours have passed since login');
        // Clear expired session
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        setCurrentUser(null);
      } else {
        console.log(`Session valid - ${Math.floor((tenHours - timeElapsed) / (1000 * 60))} minutes remaining`);
        setCurrentUser(JSON.parse(savedUser));
      }
    }
  }, []);

  // Auto-logout timer
  React.useEffect(() => {
    let logoutTimer;

    if (currentUser) {
      const savedLoginTime = localStorage.getItem('loginTime');
      
      if (savedLoginTime) {
        const loginTime = parseInt(savedLoginTime, 10);
        const currentTime = Date.now();
        const timeElapsed = currentTime - loginTime;
        const tenHours = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
        
        // Calculate remaining time
        const remainingTime = tenHours - timeElapsed;
        
        if (remainingTime > 0) {
          console.log(`Setting logout timer for ${Math.floor(remainingTime / (1000 * 60))} minutes`);
          
          logoutTimer = setTimeout(() => {
            console.log('10-hour session timeout reached - logging out user');
            handleLogout();
          }, remainingTime);
        } else {
          // Session has already expired
          console.log('Session already expired - logging out immediately');
          handleLogout();
        }
      }
    }

    // Cleanup timer on unmount or user change
    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        console.log('Logout timer cleared');
      }
    };
  }, [currentUser, handleLogout]);

  // Theme management
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loginTime = localStorage.getItem('loginTime');

  return (
    <div className="App">
      {currentUser ? (
        <EmployeeDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout}
          loginTime={loginTime}
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
