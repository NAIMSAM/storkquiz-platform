import React, { useState, useEffect } from 'react';
import { AppView, QuizSession, QuizDefinition, StudentResponse } from './types';
import TrainerDashboard from './components/TrainerDashboard';
import QuizCreator from './components/QuizCreator';
import LiveSessionView from './components/LiveSessionView';
import StudentView from './components/StudentView';
import Pricing from './components/Pricing';
import { db, isFirebaseInitialized, ref, set, onValue, auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Login from './components/Login';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  // Détection robuste de la "Room" via ?room= ou #student-
  const getRoomId = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) return params.get('room');
    if (window.location.hash.startsWith('#student-')) return window.location.hash.replace('#student-', '');
    return null;
  };

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [view, setView] = useState<AppView>(() => {
    if (getRoomId()) return AppView.STUDENT_JOIN;
    return AppView.LOGIN; // Default to Login instead of Dashboard
  });

  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);

  // Auth Listener
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync/Create Profile on Login
        await import('./services/userService').then(m => m.syncUserProfile(currentUser));
      }
      setAuthLoading(false);

      // Redirect logic based on Auth
      if (!getRoomId()) {
        if (currentUser) {
          // If user just logged in, go to dashboard
          if (view === AppView.LOGIN) setView(AppView.TRAINER_DASHBOARD);
        } else {
          // If not logged in, force Login view (unless it is student view)
          setView(AppView.LOGIN);
        }
      }
    });
    return () => unsubscribe();
  }, [auth, view]);

  // Synchronisation
  useEffect(() => {
    // 1. Charger session locale (pour le formateur)
    const savedSession = localStorage.getItem('active_quiz_session');
    if (savedSession) {
      setCurrentSession(JSON.parse(savedSession));
    }

    if (isFirebaseInitialized && db) {
      // MODE CLOUD
      const session = savedSession ? JSON.parse(savedSession) : null;
      if (session) {
        const responsesRef = ref(db, `sessions/${session.id}/responses`);
        const unsubscribe = onValue(responsesRef, (snapshot) => {
          const data = snapshot.val();
          setResponses(data ? Object.values(data) : []);
        });
        return () => unsubscribe();
      }
    } else {
      // MODE LOCAL (Broadcast) - Fallback seulement
      const savedResponses = localStorage.getItem('quiz_responses');
      if (savedResponses) setResponses(JSON.parse(savedResponses));

      const channel = new BroadcastChannel('quiz_sync');
      channel.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'NEW_RESPONSE') {
          setResponses(prev => {
            const updated = [...prev, data];
            localStorage.setItem('quiz_responses', JSON.stringify(updated));
            return updated;
          });
        } else if (type === 'START_SESSION') {
          setCurrentSession(data);
          localStorage.setItem('active_quiz_session', JSON.stringify(data));
        } else if (type === 'CLEAR_SESSION') {
          setCurrentSession(null);
          setResponses([]);
          localStorage.removeItem('active_quiz_session');
          localStorage.removeItem('quiz_responses');
        }
      };
      return () => channel.close();
    }
  }, [currentSession?.id]);

  const handleCreateSession = async (quizData: QuizSession | QuizDefinition) => {
    // Generate a new Session ID each time we launch, even from library
    const session: QuizSession = {
      ...quizData,
      id: Math.random().toString(36).substr(2, 9),
      isActive: true
    };

    setCurrentSession(session);
    setResponses([]);
    setView(AppView.LIVE_SESSION);
    localStorage.setItem('active_quiz_session', JSON.stringify(session));

    if (isFirebaseInitialized && db) {
      try {
        console.log("Envoi du quiz vers Firebase...", session.id);
        const promise = set(ref(db, `sessions/${session.id}`), { ...session, isActive: true, createdAt: Date.now() });

        toast.promise(promise, {
          loading: 'Lancement de la session...',
          success: 'Session en ligne ! 🚀',
          error: 'Erreur lors du lancement'
        });

        await promise;
        await set(ref(db, `sessions/${session.id}/responses`), null);
      } catch (error: any) {
        console.error("ERREUR D'ENVOI:", error);
        toast.error(`Erreur: ${error.message}`);
      }
    } else {
      console.warn("⚠️ Mode HORS LIGNE.");
      toast("Mode Hors Ligne activé", { icon: '⚠️' });
      localStorage.setItem('quiz_responses', JSON.stringify([]));
      new BroadcastChannel('quiz_sync').postMessage({ type: 'START_SESSION', data: session });
    }
  };

  const handleCloseSession = () => {
    const sessionId = currentSession?.id;
    if (isFirebaseInitialized && db && sessionId) {
      set(ref(db, `sessions/${sessionId}`), null);
    } else {
      new BroadcastChannel('quiz_sync').postMessage({ type: 'CLEAR_SESSION' });
    }
    setCurrentSession(null);
    setResponses([]);
    localStorage.removeItem('active_quiz_session');
    localStorage.removeItem('quiz_responses');
    setView(AppView.TRAINER_DASHBOARD);
    toast.success("Session terminée");

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.pathname);
    window.location.hash = '';
  };

  const submitResponse = () => { };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast.success("Déconnexion réussie");
      setView(AppView.LOGIN);
    }
  };

  useEffect(() => {
    const checkUrl = () => {
      if (getRoomId()) {
        setView(AppView.STUDENT_JOIN);
      } else {
        // Only redirect based on session if allowed
        // But the OnAuthChanged checks usually help here
      }
    };
    window.addEventListener('popstate', checkUrl);
    window.addEventListener('hashchange', checkUrl);
    return () => {
      window.removeEventListener('popstate', checkUrl);
      window.removeEventListener('hashchange', checkUrl);
    };
  }, []);

  const [quizToEdit, setQuizToEdit] = useState<QuizDefinition | null>(null);

  const goToDashboard = () => {
    setView(AppView.TRAINER_DASHBOARD);
    setQuizToEdit(null);
  };

  const goToCreator = () => {
    setView(AppView.CREATE_QUIZ);
    setQuizToEdit(null);
  };

  const handleEditQuiz = (quiz: QuizDefinition) => {
    setQuizToEdit(quiz);
    setView(AppView.CREATE_QUIZ);
  };

  // Determine background based on view
  const isStudent = view === AppView.STUDENT_JOIN;

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    in: { opacity: 1, scale: 1, y: 0 },
    out: { opacity: 0, scale: 1.02, y: -10 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  };

  return (
    <div className={`h-screen font-sans text-slate-100 flex flex-col overflow-hidden ${isStudent ? 'bg-slate-900' : 'bg-[#000510]'}`}>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid #334155'
          }
        }}
      />
      <header className={`p-6 flex justify-between items-center flex-shrink-0 ${isStudent ? 'bg-slate-800' : 'bg-[#000510] border-b border-white/5'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => user && goToDashboard()}>
          <img src="/stork-logo.png" alt="StorkMind Logo" className="h-10" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-200">
            StorkQuiz AI
          </span>
        </div>

        {!isStudent && user && (
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-slate-400 text-sm">{user.email}</span>
            {view !== AppView.TRAINER_DASHBOARD && (
              <button onClick={goToDashboard} className="text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors">
                Dashboard
              </button>
            )}
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors">
              Déconnexion
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {authLoading && (
            <motion.div key="loader" className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </motion.div>
          )}

          {!authLoading && view === AppView.LOGIN && (
            <motion.div key="login" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full">
              <Login onLoginSuccess={() => setView(AppView.TRAINER_DASHBOARD)} />
            </motion.div>
          )}

          {!authLoading && user && view === AppView.TRAINER_DASHBOARD && (
            <motion.div
              key="dashboard"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              className="h-full overflow-y-auto w-full custom-scrollbar"
            >
              <TrainerDashboard user={user} onStartNew={goToCreator} onLaunchSession={handleCreateSession} onEditQuiz={handleEditQuiz} onViewPricing={() => setView(AppView.PRICING)} />
            </motion.div>
          )}

          {view === AppView.PRICING && (
            <motion.div
              key="pricing"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              className="h-full overflow-y-auto w-full custom-scrollbar"
            >
              <Pricing
                onSelectPlan={(plan) => {
                  toast.success(`Plan ${plan} sélectionné (Simulation)`);
                  // TODO: Stripe integration
                  setView(AppView.TRAINER_DASHBOARD);
                }}
                onClose={() => setView(AppView.TRAINER_DASHBOARD)}
              />
            </motion.div>
          )}

          {view === AppView.CREATE_QUIZ && (
            <motion.div
              key="creator"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              className="h-full overflow-y-auto w-full custom-scrollbar"
            >
              <QuizCreator onQuizCreated={handleCreateSession} onCancel={goToDashboard} initialQuiz={quizToEdit} />
            </motion.div>
          )}

          {view === AppView.LIVE_SESSION && currentSession && (
            <motion.div
              key="live"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              className="h-full"
            >
              <LiveSessionView session={currentSession} responses={responses} onClose={handleCloseSession} />
            </motion.div>
          )}

          {view === AppView.STUDENT_JOIN && (
            <motion.div
              key="student"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              className="h-full"
            >
              <StudentView session={currentSession} onSubmitResponse={submitResponse} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
