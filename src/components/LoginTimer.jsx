import React, { useState, useEffect } from 'react';

const LoginTimer = ({ loginTime }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const tenHours = 10 * 60 * 60 * 1000;
      const elapsedTime = Date.now() - loginTime;
      const remaining = tenHours - elapsedTime;

      if (remaining <= 0) {
        setTimeRemaining('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [loginTime]);

  return (
    <div className="text-xs text-sidebar-foreground mt-1">
      Time Remaining: {timeRemaining}
    </div>
  );
};

export default LoginTimer;
