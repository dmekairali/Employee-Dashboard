import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import './index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

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

export default App;
