import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import BottomTabBar from '@/components/BottomTabBar';
import { useTabStack } from '@/components/TabStackProvider';

const ContentSpinner = () => (
  <div className="h-full flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
  </div>
);

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function AppLayout() {
  const location = useLocation();
  const { saveScroll, getScroll } = useTabStack();
  const mainRef = useRef(null);

  // Preserve each tab's scroll position across tab switches and child-screen
  // round-trips. The scroll container is the page root (`.overscroll-none`).
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const path = location.pathname;
    // Restore after the exit animation completes and the new page mounts.
    const t = setTimeout(() => {
      const scroller = main.querySelector('.overscroll-none');
      if (scroller) scroller.scrollTop = getScroll(path);
    }, 220);
    return () => {
      clearTimeout(t);
      const scroller = main.querySelector('.overscroll-none');
      if (scroller) saveScroll(path, scroller.scrollTop);
    };
  }, [location.pathname, getScroll, saveScroll]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-x-hidden">
      <NavBar />
      <main ref={mainRef} className="flex-1 overflow-hidden relative pb-tabbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <Suspense fallback={<ContentSpinner />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomTabBar />
    </div>
  );
}