
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { QuizSession, StudentResponse, LiveStats, SessionState, SessionStatus } from '../types';
import { generateSessionReport } from '../services/report';
import QRCode from 'react-qr-code';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { db, isFirebaseInitialized, ref, set, onValue } from '../services/firebase';

import confetti from 'canvas-confetti';

interface LiveSessionViewProps {
  session: QuizSession;
  responses: StudentResponse[];
  onClose: () => void;
}

const LiveSessionView: React.FC<LiveSessionViewProps> = ({ session, responses, onClose }) => {
  const [sessionState, setSessionState] = useState<SessionState>({
    currentQuestionIndex: -1,
    status: 'WAITING',
    startTime: Date.now(),
    totalQuestions: session.questions.length
  });

  const [timeLeft, setTimeLeft] = useState(20);
  const [copied, setCopied] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);

  // Sync Participants Count
  useEffect(() => {
    if (isFirebaseInitialized && db) {
      const participantsRef = ref(db, `sessions/${session.id}/participants`);
      const unsubscribe = onValue(participantsRef, (snapshot) => {
        const data = snapshot.val();
        setParticipantsCount(data ? Object.keys(data).length : 0);
      });
      return () => unsubscribe();
    }
  }, [session.id]);

  // Confetti Effect on Leaderboard
  useEffect(() => {
    if (sessionState.status === 'LEADERBOARD') {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22d3ee', '#f472b6', '#fbbf24'] // Cyan, Pink, Yellow
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22d3ee', '#f472b6', '#fbbf24']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [sessionState.status]);

  // Initial Sync & Setup
  useEffect(() => {
    if (isFirebaseInitialized && db) {
      const stateRef = ref(db, `sessions/${session.id}/state`);

      // Initialize state in DB if it doesn't exist or if we are restarting
      set(stateRef, {
        currentQuestionIndex: -1,
        status: 'WAITING',
        startTime: Date.now(),
        totalQuestions: session.questions.length
      });

      const unsubscribe = onValue(stateRef, (snapshot) => {
        const val = snapshot.val();
        if (val) setSessionState(val);
      });
      return () => unsubscribe();
    }
  }, [session.id]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (sessionState.status === 'QUESTION') {
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - sessionState.startTime) / 1000);
        const remaining = Math.max(0, 20 - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          // Auto-reveal when time is up
          updateState({ ...sessionState, status: 'REVEAL' });
        }
      };

      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 500);
    }
    return () => clearInterval(interval);
  }, [sessionState.status, sessionState.startTime]);

  const updateState = (newState: SessionState) => {
    setSessionState(newState); // Optimistic update
    if (isFirebaseInitialized && db) {
      set(ref(db, `sessions/${session.id}/state`), newState);
    }
  };

  const startSession = () => {
    updateState({
      currentQuestionIndex: 0,
      status: 'QUESTION',
      startTime: Date.now(),
      totalQuestions: session.questions.length
    });
  };

  const nextQuestion = () => {
    if (sessionState.currentQuestionIndex < session.questions.length - 1) {
      updateState({
        currentQuestionIndex: sessionState.currentQuestionIndex + 1,
        status: 'QUESTION',
        startTime: Date.now(),
        totalQuestions: session.questions.length
      });
    } else {
      updateState({
        ...sessionState,
        status: 'LEADERBOARD' // Or finished
      });
    }
  };

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', session.id);
    url.hash = '';
    return url.toString();
  }, [session.id]);

  const copyToClipboard = () => {
    // Robust copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(joinUrl);
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = joinUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats calculation
  const currentStats = useMemo(() => {
    const currentQId = session.questions[sessionState.currentQuestionIndex]?.id;
    if (!currentQId) return null;

    const s = { total: 0, responses: [0, 0, 0, 0] };
    responses.forEach(r => {
      if (r.questionId === currentQId) {
        s.total++;
        s.responses[r.selectedOption]++;
      }
    });
    return s;
  }, [responses, sessionState.currentQuestionIndex]);

  // Render Helpers
  const renderLobby = () => (
    <div className="flex flex-col items-center justify-center h-full animate-fadeIn p-4 overflow-hidden relative">
      <div className="bg-[#0f172a] p-6 lg:p-8 rounded-3xl shadow-xl border border-slate-700 text-center max-w-md w-full my-auto flex flex-col max-h-full overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-bold mb-4 text-white">Rejoignez le Quiz !</h2>
        <div className="p-4 bg-white border-4 border-cyan-500 rounded-3xl mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] inline-block flex-shrink-0">
          <QRCode size={150} value={joinUrl} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
        </div>
        <div className="mb-4">
          <div className="text-sm font-bold text-slate-400 mb-1">Code de session</div>
          <div className="text-3xl font-black text-cyan-400 tracking-wider font-mono bg-slate-800 p-3 rounded-xl border border-cyan-500/30 select-all">{session.id}</div>
        </div>
        <div className="text-slate-400 font-medium mb-6">
          <span className="text-cyan-400 font-bold text-xl">{participantsCount}</span> participants connectés
        </div>
        {/* ... buttons ... */}
        <button
          onClick={startSession}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl text-xl font-bold shadow-lg hover:shadow-cyan-500/30 transition-all transform active:scale-95 animate-bounce mb-4"
        >
          Commencer la Session 🚀
        </button>
        <div className="flex justify-between gap-2 mt-auto">
          <button onClick={copyToClipboard} className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1">
            {copied ? '✅ Copié !' : '🔗 Copier lien'}
          </button>
          <button onClick={() => window.open(joinUrl, '_blank')} className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1">📱 Vue étudiant</button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const q = session.questions[sessionState.currentQuestionIndex];
    return (
      <div className="flex flex-col h-full animate-fadeIn w-full relative">
        {/* Header Section */}
        <div className="flex justify-between items-center py-2 flex-shrink-0">
          <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold text-sm border border-slate-700 shadow-sm">
            Question {sessionState.currentQuestionIndex + 1} / {session.questions.length}
          </span>
          <div className={`flex items-center gap-2 text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
            <span className="text-3xl">⏱</span> {timeLeft}s
          </div>
        </div>

        {/* Question Title - Flexible Height but shrinkable */}
        <div className="flex-shrink-1 flex items-center justify-center py-4 min-h-[10vh] max-h-[20vh] overflow-y-auto mt-4">
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight text-center max-w-5xl">
            {q.question}
          </h2>
        </div>

        {/* Options Grid - Takes remaining space */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-h-0 pb-24 md:pb-28">
          {q.options.map((opt, idx) => (
            <div key={idx} className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 shadow-lg flex items-center gap-6 hover:border-cyan-500/50 transition-colors h-full overflow-hidden">
              <span className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-400 flex-shrink-0 text-xl">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-lg md:text-xl font-medium text-slate-300 line-clamp-4">
                {opt}
              </span>
            </div>
          ))}
        </div>

        {/* Footer - Fixed */}
        <div className="absolute bottom-0 left-0 right-0 py-4 bg-[#000510]/95 backdrop-blur-md border-t border-white/5 flex justify-between items-center z-50">
          <div className="text-slate-400 font-bold flex items-center gap-2">
            <span className="text-cyan-400 text-xl">{currentStats?.total || 0}</span> réponses reçues
          </div>
          <button onClick={() => updateState({ ...sessionState, status: 'REVEAL' })} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-cyan-50 transition-colors shadow-lg">
            Révéler maintenant
          </button>
        </div>
      </div>
    );
  };

  const renderReveal = () => {
    const q = session.questions[sessionState.currentQuestionIndex];
    const data = q.options.map((opt, i) => ({
      name: String.fromCharCode(65 + i),
      text: opt,
      value: currentStats?.responses[i] || 0,
      isCorrect: i === q.correctAnswerIndex
    }));

    return (
      <div className="flex flex-col h-full animate-fadeIn w-full relative">
        <h2 className="text-xl md:text-3xl font-bold text-white py-4 text-center flex-shrink-0 max-h-[15vh] overflow-y-auto">{q.question}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch min-h-0 pb-24 md:pb-28">
          {/* Chart Section - Flexible Height, no fixed h-96 */}
          <div className="lg:col-span-2 bg-[#0f172a] p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col min-h-0">
            <div className="flex-grow min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isCorrect ? '#22d3ee' : '#334155'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Options List with Correct Answer Highlight */}
          <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 flex flex-col">
            {q.options.map((opt, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${i === q.correctAnswerIndex ? 'bg-cyan-900/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-[#1e293b] border-slate-700 text-slate-500 opacity-60'}`}>
                {i === q.correctAnswerIndex && <span className="text-xl">✅</span>}
                <span className="font-bold text-md leading-tight">{opt}</span>
                <span className="ml-auto font-mono opacity-50 bg-slate-800 px-2 py-1 rounded text-xs">{currentStats?.responses[i] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 py-6 bg-[#000510]/95 backdrop-blur-md border-t border-white/5 flex justify-end items-center z-50 shadow-2xl">
          <button onClick={nextQuestion} className="px-12 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] shadow-lg transform active:scale-95 transition-all">
            {sessionState.currentQuestionIndex < session.questions.length - 1 ? 'Question Suivante →' : 'Voir le classement 🏆'}
          </button>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    // Calcul des scores
    const scores: Record<string, number> = {};
    responses.forEach(r => {
      if (!scores[r.studentName]) scores[r.studentName] = 0;
      if (r.isCorrect) scores[r.studentName] += 100; // +100 per correct answer
    });

    const ranking = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([name, score], i) => ({ rank: i + 1, name, score }));

    return (
      <div className="flex flex-col items-center justify-center h-full animate-fadeIn w-full max-w-4xl mx-auto px-4 overflow-hidden absolute inset-0 pb-24">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 drop-shadow-lg text-center flex-shrink-0 mt-8">🏆 Classement Final</h2>

        <div className="w-full space-y-4 flex-grow overflow-y-auto custom-scrollbar px-2">
          {ranking.slice(0, 10).map((player, idx) => (
            <div key={idx} className={`flex items-center justify-between p-4 md:p-6 rounded-3xl border transform transition-all hover:scale-[1.02] ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'bg-[#1e293b] border-slate-700 shadow-md'}`}>
              <div className="flex items-center gap-4 md:gap-8">
                <span className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-3xl font-black rounded-full shadow-lg ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-800 text-slate-500'}`}>
                  {player.rank}
                </span>
                <span className={`text-xl md:text-3xl font-bold ${idx === 0 ? 'text-yellow-400' : 'text-slate-300'}`}>{player.name}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-cyan-400 font-mono">
                {player.score} <span className="text-sm text-slate-500">pts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 py-6 bg-[#000510]/95 backdrop-blur-md border-t border-white/5 flex justify-center gap-6 z-50">
          <div className="flex gap-4">
            <button
              onClick={() => generateSessionReport(session, responses)}
              className="px-8 py-4 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-all flex items-center gap-2 border border-slate-600"
            >
              📄 Télécharger Rapport
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-red-500/10 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/30"
            >
              Terminer la session
            </button>
          </div>
          <button onClick={() => updateState({ ...sessionState, currentQuestionIndex: -1, status: 'WAITING' })} className="px-8 py-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 rounded-2xl font-bold hover:bg-cyan-500/20 transition-colors">Rejouer</button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative">
      {sessionState.status === 'WAITING' && renderLobby()}
      {sessionState.status === 'QUESTION' && renderQuestion()}
      {sessionState.status === 'REVEAL' && renderReveal()}
      {sessionState.status === 'LEADERBOARD' && renderLeaderboard()}
    </div>
  );
};

export default LiveSessionView;
