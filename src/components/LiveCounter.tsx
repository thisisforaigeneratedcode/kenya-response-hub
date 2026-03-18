import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface LiveCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
}

export function LiveCounter({ value, label, icon }: LiveCounterProps) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.floor(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsub = display.on('change', (v) => setDisplayValue(v));
    return unsub;
  }, [value, spring, display]);

  return (
    <div className="glass-card p-6 text-center">
      <div className="flex justify-center mb-3 text-primary">{icon}</div>
      <motion.div className="text-4xl font-bold text-foreground tabular-nums">
        {displayValue.toLocaleString()}
      </motion.div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
