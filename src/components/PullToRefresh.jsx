import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 60;
const MAX_PULL = 90;

export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = (e) => {
    if (refreshing) return;
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, MAX_PULL));
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull > THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPull(MAX_PULL);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ overflowY: 'auto', overscrollBehaviorY: 'contain' }}
    >
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: refreshing || pull === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {pull > 0 && (
          <div className="flex justify-center py-2" aria-hidden="true">
            <RefreshCw className={`w-5 h-5 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}