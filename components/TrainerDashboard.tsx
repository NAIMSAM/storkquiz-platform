
import React, { useEffect, useState } from 'react';
import { isFirebaseInitialized, db, ref, onValue, set } from '../services/firebase';
import { QuizDefinition } from '../types';

interface TrainerDashboardProps {
  onStartNew: () => void;
  onLaunchSession: (quiz: QuizDefinition) => void;
  onEditQuiz: (quiz: QuizDefinition) => void;
}

import { auth } from '../services/firebase'; // Ensure auth is imported
import { User } from 'firebase/auth';
import { UserProfile, SubscriptionTier } from '../types';
import { subscribeToProfile } from '../services/userService';

interface TrainerDashboardProps {
  onStartNew: () => void;
  onLaunchSession: (quiz: QuizDefinition) => void;
  onEditQuiz: (quiz: QuizDefinition) => void;
  onViewPricing: () => void;
  user: User | null;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onStartNew, onLaunchSession, onEditQuiz, onViewPricing, user }) => {
  const [cloudStatus, setCloudStatus] = useState<boolean>(false);
  const [library, setLibrary] = useState<QuizDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Sync Profile
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToProfile(user.uid, (p) => setProfile(p));
      return () => unsubscribe();
    }
  }, [user]);

  // Sync Library Logic (User Specific)
  const syncLibrary = () => {
    if (!user) return;

    if (isFirebaseInitialized && db) {
      // PRO: User specific path
      const quizzesRef = ref(db, `users/${user.uid}/quizzes`);

      onValue(quizzesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const cloudQuizzes = Object.values(data) as QuizDefinition[];
          setLibrary(cloudQuizzes.sort((a, b) => b.createdAt - a.createdAt));
        } else {
          setLibrary([]);
        }
        setIsLoading(false);
      });
    } else {
      // Local Fallback
      const localLib = localStorage.getItem('quiz_library');
      let quizzes: QuizDefinition[] = localLib ? JSON.parse(localLib) : [];
      setLibrary(quizzes.sort((a, b) => b.createdAt - a.createdAt));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCloudStatus(isFirebaseInitialized);
    syncLibrary();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce quiz ?")) return;

    // 1. Delete Local
    const localLib = localStorage.getItem('quiz_library');
    if (localLib) {
      const quizzes: QuizDefinition[] = JSON.parse(localLib);
      const newQuizzes = quizzes.filter(q => q.id !== quizId);
      localStorage.setItem('quiz_library', JSON.stringify(newQuizzes));
      // Force update immediately for local changes if offline or just to be responsive
      setLibrary(prev => prev.filter(q => q.id !== quizId));
    }

    // 2. Delete Firebase
    if (isFirebaseInitialized && db && user) {
      try {
        await set(ref(db, `users/${user.uid}/quizzes/${quizId}`), null);
      } catch (err) {
        console.error("Erreur suppression Firebase", err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-start py-12 px-4 space-y-12 animate-fadeIn w-full">
      <div className="text-center space-y-6 max-w-3xl relative">
        <div className="flex items-center justify-center gap-4 mb-4">
          {profile && (
            <div className="flex items-center gap-2 bg-slate-800 rounded-full px-4 py-1.5 border border-slate-700">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${profile.subscriptionTier === SubscriptionTier.PRO ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                {profile.subscriptionTier} PLAN
              </span>
              <span className="text-slate-400 text-sm border-l border-slate-700 pl-2">
                {profile.usage.quizzesCreated} / {profile.limits.maxQuizzes} Quiz
              </span>
            </div>
          )}

          {profile?.subscriptionTier === SubscriptionTier.FREE && (
            <button onClick={onViewPricing} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
              👑 PASSER PRO
            </button>
          )}
        </div>
        <h2 className="text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
          Transformez vos <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Formations</span>
        </h2>
        <p className="text-lg text-slate-400 leading-relaxed font-medium">
          Générez des quiz interactifs à partir de votre contenu en quelques secondes grâce à l'IA. <br />
          Engagez votre audience avec des retours en temps réel et une expérience gamifiée.
        </p>
      </div>

      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1 h-8 bg-cyan-500 rounded-full"></span>
            Ma Bibliothèque
            <span className="text-slate-500 text-lg font-medium ml-2">({library.length})</span>
          </h3>
          <button
            onClick={onStartNew}
            className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <span className="relative flex items-center gap-2">
              <span className="text-xl">+</span> Nouveau Quiz
            </span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500"></div>
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
            </div>
          </div>
        ) : library.length === 0 ? (
          <div className="bg-[#0f172a] text-center p-16 rounded-3xl border border-dashed border-slate-700/50">
            <div className="text-6xl mb-6">🚀</div>
            <p className="text-white font-bold text-xl mb-3">Votre bibliothèque est vide</p>
            <p className="text-slate-500 text-sm">Créez votre premier quiz avec l'IA pour commencer !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.map((quiz) => (
              <div key={quiz.id} className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800/50 hover:border-cyan-500/30 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:-translate-y-1 group flex flex-col justify-between h-[220px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-800 rounded-lg text-2xl group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">📝</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 px-2 py-1 rounded">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditQuiz(quiz); }}
                        className="text-slate-600 hover:text-cyan-500 hover:bg-cyan-500/10 p-1 rounded transition-colors"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, quiz.id)}
                        className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-200 line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors" title={quiz.title}>{quiz.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span className="bg-slate-800 px-2 py-1 rounded-md text-cyan-500">{quiz.questions.length} QUESTIONS</span>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchSession(quiz)}
                  className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white transition-all flex justify-center items-center gap-2 mt-4 group-hover:shadow-lg"
                >
                  <span>▶️</span> Lancer Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-3xl p-1 border border-white/5 max-w-6xl shadow-2xl">
        <div className="bg-[#050b14] rounded-[22px] p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <span className="bg-pink-500/10 text-pink-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-pink-500/20">Astuce Pro</span>
              <h4 className="text-2xl font-bold text-white">Réutilisez & Adaptez</h4>
              <p className="text-slate-400">Lancez des sessions illimitées à partir d'un seul modèle de quiz. Chaque session génère un code unique pour vos étudiants.</p>
            </div>
          </div>
          {/* Background Glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
