import React, { useState, useEffect } from 'react';

const LoginTimer = ({ loginTime }) => {
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - loginTime;

      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [loginTime]);

  return (
    <div className="text-xs text-sidebar-foreground mt-1">
      Logged In: {elapsedTime}
    </div>
  );
};

export default LoginTimer;
