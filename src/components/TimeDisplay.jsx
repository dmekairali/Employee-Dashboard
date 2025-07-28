import React, { useState, useEffect } from 'react';

const TimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} • {currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}
    </>
  );
};

export default TimeDisplay;
