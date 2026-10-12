import { useState, useEffect } from 'react';

const useLiveTime = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
};

export default useLiveTime;
