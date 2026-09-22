import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ThemeProvider from '@/components/ThemeProvider';
import AppLayout from '@/components/AppLayout';
import { TabStackProvider } from '@/components/TabStackProvider';

// Code-split pages
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NewCampaign = lazy(() => import('@/pages/NewCampaign'));
const CampaignGame = lazy(() => import('@/pages/CampaignGame'));
const CampaignDetails = lazy(() => import('@/pages/CampaignDetails'));
const CharacterSheet = lazy(() => import('@/pages/CharacterSheet'));
const CharacterEditor = lazy(() => import('@/pages/CharacterEditor'));
const CharacterForge = lazy(() => import('@/pages/CharacterForge'));
const ImportCharacter = lazy(() => import('@/pages/ImportCharacter'));
const StoryRecap = lazy(() => import('@/pages/StoryRecap'));
const InvitePlayers = lazy(() => import('@/pages/InvitePlayers'));
const JoinCampaign = lazy(() => import('@/pages/JoinCampaign'));
const CampaignMapPage = lazy(() => import('@/pages/CampaignMapPage'));
const Characters = lazy(() => import('@/pages/Characters'));
const Stories = lazy(() => import('@/pages/Stories'));
const Settings = lazy(() => import('@/pages/Settings'));
const LazyPageNotFound = lazy(() => import('./lib/PageNotFound'));

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-stone-950">
    <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
  </div>
);

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
};

function PageWrapper({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <TabStackProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          {/* Tab root screens share the app chrome (NavBar + BottomTabBar) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* Child screens keep their own headers / full-screen layouts */}
          <Route path="/new-campaign" element={<PageWrapper><NewCampaign /></PageWrapper>} />
          <Route path="/campaign/:id" element={<PageWrapper><CampaignGame /></PageWrapper>} />
          <Route path="/campaign/:id/details" element={<PageWrapper><CampaignDetails /></PageWrapper>} />
          <Route path="/character/:id" element={<PageWrapper><CharacterSheet /></PageWrapper>} />
          <Route path="/character/:id/edit" element={<PageWrapper><CharacterEditor /></PageWrapper>} />
          <Route path="/character-forge" element={<PageWrapper><CharacterForge /></PageWrapper>} />
          <Route path="/import-character" element={<PageWrapper><ImportCharacter /></PageWrapper>} />
          <Route path="/story-recap" element={<PageWrapper><StoryRecap /></PageWrapper>} />
          <Route path="/campaign/:id/invite" element={<PageWrapper><InvitePlayers /></PageWrapper>} />
          <Route path="/campaign/:id/map" element={<PageWrapper><CampaignMapPage /></PageWrapper>} />
          <Route path="/join" element={<PageWrapper><JoinCampaign /></PageWrapper>} />
        </Route>
        <Route path="*" element={<LazyPageNotFound />} />
      </Routes>
      </TabStackProvider>
    </Suspense>
  );
};


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App