'use client';

import { useEffect, useState } from 'react';

interface ShiftTimerProps {
  clockInTime: string; // ISO date string
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function ShiftTimer({ clockInTime }: ShiftTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(clockInTime).getTime();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick(); // immediate first paint
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <span className='font-mono text-4xl font-bold tracking-widest text-primary tabular-nums'>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
