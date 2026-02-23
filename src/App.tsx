import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import Analysis from '@/pages/Analysis';
import Chat from '@/pages/Chat';
import About from '@/pages/About';
import Report from '@/pages/Report';
import Auth from '@/pages/Auth';
import History from '@/pages/History';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

function FloatingChatButton() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const isAuthPage = location.pathname === '/auth';
  const [showBot, setShowBot] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowBot(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (isAuthPage) return null;

  return (
    <AnimatePresence>
      {!isChatPage && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: [0, -8, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            },
            scale: { type: "spring", stiffness: 260, damping: 20 }
          }}
          className="fixed bottom-8 right-8 z-50"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/chat')}
            className="group relative flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-blue-500/50 focus:outline-none ring-4 ring-white/20 backdrop-blur-sm"
          >
            {/* Continuous Pulse Ring */}
            <span className="absolute -inset-1 rounded-full border border-white/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-1000" />
            <span className="absolute -inset-3 rounded-full border border-blue-500/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-1000" />
            
            {/* Animated Icon Switcher */}
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {showBot ? (
                  <motion.div
                    key="bot"
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Bot className="h-8 w-8 drop-shadow-md" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MessageSquare className="h-8 w-8 drop-shadow-md" />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300 animate-pulse" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Notification Dot */}
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-emerald-400 border-2 border-indigo-600 z-20">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            </span>
            
            {/* Tooltip Label */}
            <div className="absolute right-full mr-4 px-4 py-2 bg-slate-900/90 text-white text-sm font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none backdrop-blur-md border border-white/10">
              {t('app.aiAssistant')}
              <div className="absolute top-1/2 -right-1 -mt-1 border-4 border-transparent border-l-slate-900/90" />
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
     return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/analysis" element={
              <ProtectedRoute>
                <Analysis />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/about" element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            } />
          </Routes>
          <FloatingChatButton />
          <Toaster />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
