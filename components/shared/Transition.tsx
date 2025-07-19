
import React, { useState, useEffect } from 'react';

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
}

export const Transition: React.FC<TransitionProps> = ({ show, children }) => {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (show) {
      const frame = requestAnimationFrame(() => {
        setHasStarted(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setHasStarted(false);
    }
  }, [show]);

  return (
    <div
      style={{
        transition: 'opacity 200ms ease-in-out',
        opacity: hasStarted ? 1 : 0,
        gridArea: '1 / 1',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
};
