import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// clip-path shapes approximating each die face
const SHAPES = {
  4: 'polygon(50% 2%, 98% 98%, 2% 98%)',
  6: 'polygon(6% 6%, 94% 6%, 94% 94%, 6% 94%)',
  8: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)',
  10: 'polygon(50% 2%, 93% 38%, 76% 96%, 24% 96%, 7% 38%)',
  12: 'polygon(50% 2%, 93% 27%, 93% 73%, 50% 98%, 7% 73%, 7% 27%)',
  20: 'polygon(50% 2%, 90% 22%, 98% 60%, 78% 94%, 22% 94%, 2% 60%, 10% 22%)',
  100: 'polygon(50% 2%, 90% 22%, 98% 60%, 78% 94%, 22% 94%, 2% 60%, 10% 22%)',
};

// vertical offset so the number reads centered inside each shape
const PAD_TOP = { 4: '38%', 8: '30%', 10: '26%', 12: '24%', 20: '22%', 100: '22%', 6: '0%' };

export default function RollingDie({ sides, finalResult, onComplete, duration = 900, size = 76 }) {
  const [display, setDisplay] = useState(() => Math.floor(Math.random() * sides) + 1);
  const completedRef = useRef(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setDisplay(Math.floor(Math.random() * sides) + 1);
    }, 70);
    const settle = setTimeout(() => {
      clearInterval(tick);
      setDisplay(finalResult);
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, duration);
    return () => {
      clearInterval(tick);
      clearTimeout(settle);
    };
  }, []);

  const shape = SHAPES[sides] || SHAPES[6];
  const padTop = PAD_TOP[sides] || '0%';
  const isCrit = finalResult === sides;
  const isFumble = finalResult === 1 && sides > 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
        animate={{ rotate: [0, 220, 480, 720], scale: [0.8, 1.18, 0.92, 1], opacity: 1 }}
        transition={{ duration: duration / 1000, ease: 'easeOut', times: [0, 0.4, 0.75, 1] }}
        style={{
          width: size,
          height: size,
          clipPath: shape,
          background: isCrit
            ? 'linear-gradient(135deg, #064e3b, #10b981)'
            : isFumble
            ? 'linear-gradient(135deg, #7f1d1d, #ef4444)'
            : 'linear-gradient(135deg, #78350f, #d97706)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: padTop,
          boxShadow: '0 6px 18px rgba(0,0,0,0.5), inset 0 0 12px rgba(0,0,0,0.35)',
        }}
      >
        <span className="font-bold text-amber-50 leading-none" style={{ fontSize: size * 0.34 }}>
          {display}
        </span>
      </motion.div>
      <span className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">d{sides}</span>
    </div>
  );
}