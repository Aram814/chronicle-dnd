import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import BottomTabBar from '@/components/BottomTabBar';

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
  return (
    <div className="flex flex-col h-screen bg-stone-950 text-stone-200 overflow-x-hidden">
      <NavBar />
      <main className="flex-1 overflow-hidden relative pb-tabbar">
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