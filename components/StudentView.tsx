
import React, { useState, useEffect } from 'react';
import { QuizSession, StudentResponse, SessionState } from '../types';
import { db, isFirebaseInitialized, ref, onValue, push } from '../services/firebase';

interface StudentViewProps {
  session: QuizSession | null;
  onSubmitResponse: (response: StudentResponse) => void;
}

const StudentView: React.FC<StudentViewProps> = ({ session, onSubmitResponse }) => {
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [liveSession, setLiveSession] = useState<QuizSession | null>(session);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // 1. Connection Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) setRoomId(room);
    else if (window.location.hash.startsWith('#student-')) setRoomId(window.location.hash.replace('#student-', ''));
  }, []);

  useEffect(() => {
    if (!roomId || !isFirebaseInitialized || !db) return;

    // Load static session data
    const sessionRef = ref(db, `sessions/${roomId}`);
    const unsubSession = onValue(sessionRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setLiveSession(val);
        setFirebaseError(null);
      } else {
        setFirebaseError("Session introuvable.");
      }
    }, (err) => setFirebaseError(err.message));

    // Load dynamic state
    const stateRef = ref(db, `sessions/${roomId}/state`);
    const lastIndexRef = { current: -1 }; // Local Ref to track index changes inside callback

    const unsubState = onValue(stateRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setSessionState(val);

        // Force reset selection if the question index has changed
        if (val.currentQuestionIndex !== lastIndexRef.current) {
          setSelectedOption(null);
          lastIndexRef.current = val.currentQuestionIndex;
        }
      }
    });

    return () => {
      unsubSession();
      unsubState();
    };
  }, [roomId]);



  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setHasJoined(true);
      const cleanName = name.trim();
      localStorage.setItem('student_name', cleanName);

      // Push to participants list in Firebase
      if (isFirebaseInitialized && db && roomId) {
        const participantRef = ref(db, `sessions/${roomId}/participants`);
        // We use push to generate a unique ID, or we could use the name as key if we want unique names
        // Let's use push for simplicity and consistency
        push(participantRef, {
          name: cleanName,
          joinedAt: Date.now()
        });
      }
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem('student_name');
    if (savedName) setName(savedName);
  }, []);

  const handleAnswer = (optionIdx: number) => {
    if (!liveSession || !sessionState || sessionState.status !== 'QUESTION') return;

    setSelectedOption(optionIdx);

    const question = liveSession.questions[sessionState.currentQuestionIndex];
    if (!question) return;

    const isCorrect = optionIdx === question.correctAnswerIndex;
    const response: StudentResponse = {
      studentName: name,
      questionId: question.id,
      selectedOption: optionIdx,
      isCorrect,
      timestamp: Date.now()
    };

    if (isFirebaseInitialized && db) {
      push(ref(db, `sessions/${liveSession.id}/responses`), response);
    }
  };

  if (!hasJoined) {
    if (!liveSession) return <div className="p-8 text-center text-slate-400">Chargement de la session...</div>;
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-8 animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="text-5xl">👋</div>
          <h2 className="text-3xl font-bold text-white">Bienvenue !</h2>
          <p className="text-xl font-extrabold text-cyan-400 bg-cyan-900/20 py-3 px-6 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">{liveSession.title}</p>
        </div>
        <form onSubmit={handleJoin} className="space-y-6 bg-[#0f172a] p-8 rounded-3xl shadow-xl border border-slate-700">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Quel est votre prénom ?</label>
            <input
              type="text" required autoFocus placeholder="Ex: Jean" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-4 text-center border-2 border-slate-600 bg-slate-800 text-white rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none text-xl font-bold transition-all placeholder-slate-500"
            />
          </div>
          <button type="submit" className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-cyan-500/20 transform active:scale-95 transition-all">Participer</button>
        </form>
      </div>
    );
  }

  if (!liveSession || !sessionState) return <div className="p-8 text-center text-slate-400">En attente du formateur...</div>;

  // LOBBY
  if (sessionState.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fadeIn text-white">
        <div className="text-6xl mb-6 animate-bounce">⏳</div>
        <h2 className="text-2xl font-bold mb-2">Ça va commencer !</h2>
        <p className="text-slate-400">Préparez-vous <strong className="text-cyan-400">{name}</strong>...</p>
      </div>
    );
  }

  // FINISHED
  if (sessionState.status === 'LEADERBOARD' || sessionState.status === 'FINISHED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fadeIn text-white">
        <div className="text-6xl mb-6">🏁</div>
        <h2 className="text-3xl font-bold mb-4">Quiz Terminé !</h2>
        <p className="text-slate-400 mb-8">Regardez l'écran du formateur pour les résultats.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700"
        >
          Quitter
        </button>
      </div>
    );
  }

  // QUESTION & REVEAL
  const currentQuestion = liveSession.questions[sessionState.currentQuestionIndex];
  if (!currentQuestion) return <div className="text-red-400 text-center p-8">Erreur de synchronisation...</div>;

  const isReveal = sessionState.status === 'REVEAL';

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-6 animate-fadeIn">
      <div className="bg-[#0f172a] p-3 rounded-2xl shadow-sm border border-slate-700 flex justify-between items-center text-xs font-bold uppercase">
        <span className="bg-cyan-600 text-white px-2 py-1 rounded-lg">Q {sessionState.currentQuestionIndex + 1} / {liveSession.questions.length}</span>
        <span className="text-cyan-400">{name}</span>
      </div>

      <div className="bg-[#0f172a] p-8 rounded-3xl shadow-xl border border-slate-700 space-y-8 min-h-[400px] flex flex-col relative overflow-hidden">
        {/* Feedback Overlay on Reveal */}
        {isReveal && selectedOption !== null && (
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${selectedOption === currentQuestion.correctAnswerIndex ? 'from-green-400 to-green-600' : 'from-red-400 to-red-600'}`}></div>
        )}

        <h3 className="text-xl font-bold text-white">{currentQuestion.question}</h3>

        <div className="grid grid-cols-1 gap-4 flex-grow">
          {currentQuestion.options.map((option, idx) => {
            let styleClass = 'bg-slate-800 border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-white';

            if (isReveal) {
              if (idx === currentQuestion.correctAnswerIndex) styleClass = 'bg-green-900/30 border-green-500 text-green-400 font-bold';
              else if (idx === selectedOption) styleClass = 'bg-red-900/30 border-red-500 text-red-400 opacity-60';
              else styleClass = 'opacity-30 grayscale border-slate-800';
            } else {
              if (selectedOption === idx) styleClass = 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transform scale-[1.02] z-10';
              else if (selectedOption !== null) styleClass = 'opacity-50 border-slate-700'; // Dim others
            }

            return (
              <button
                key={idx}
                disabled={isReveal || selectedOption !== null} // Lock answer once selected
                onClick={() => handleAnswer(idx)}
                className={`p-4 text-left border-2 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-4 ${styleClass}`}
              >
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${selectedOption === idx && !isReveal ? 'border-white text-white' : 'border-slate-500 text-slate-400'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
                {isReveal && idx === currentQuestion.correctAnswerIndex && <span className="ml-auto text-xl">✅</span>}
                {isReveal && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && <span className="ml-auto text-xl">❌</span>}
              </button>
            );
          })}
        </div>

        {isReveal && (
          <div className="text-center font-bold text-slate-400 animate-pulse">
            Regardez le tableau pour les résultats globaux 👀
          </div>
        )}
        {!isReveal && selectedOption !== null && (
          <div className="text-center font-bold text-cyan-400">
            Réponse envoyée ! Attendez la fin du chrono... ⏳
          </div>
        )}
      </div>
    </div>
  );
};


export default StudentView;
