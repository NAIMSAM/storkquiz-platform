
import React, { useState, useEffect } from 'react';
import { generateQuizFromContent } from '../services/gemini';
import { QuizSession, QuizDefinition, QuizQuestion } from '../types';
import { db, isFirebaseInitialized, ref, set, push, auth } from '../services/firebase';

interface QuizCreatorProps {
  onQuizCreated: (session: QuizSession) => void;
  onCancel: () => void;
  initialQuiz?: QuizDefinition | null;
}

// State Helper Types
type CreatorView = 'INPUT' | 'REVIEW';

const QuizCreator: React.FC<QuizCreatorProps> = ({ onQuizCreated, onCancel, initialQuiz }) => {
  const [view, setView] = useState<CreatorView>('INPUT');

  // Input State
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [textContent, setTextContent] = useState(initialQuiz?.originalContent || '');
  const [images, setImages] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Review State
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial questions if editing
  useEffect(() => {
    if (initialQuiz && initialQuiz.questions) {
      setGeneratedQuestions(initialQuiz.questions);
    }
  }, [initialQuiz]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            if (newImages.length === files.length) {
              setImages(prev => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const saveQuizToLibrary = async (quiz: QuizDefinition) => {
    // 1. Sauvegarde Locale
    const localLib = localStorage.getItem('quiz_library');
    let library: QuizDefinition[] = localLib ? JSON.parse(localLib) : [];

    // Remove if exists (update)
    library = library.filter(q => q.id !== quiz.id);
    library.push(quiz);

    localStorage.setItem('quiz_library', JSON.stringify(library));

    // 2. Sauvegarde Cloud (Si connecté)
    if (isFirebaseInitialized && db) {
      try {
        const user = auth.currentUser;
        if (user) {
          await set(ref(db, `users/${user.uid}/quizzes/${quiz.id}`), quiz);

          // TODO: Increment usage count using transaction or user service
        } else {
          // Fallback for global if needed? No, prefer user isolation
          // await set(ref(db, `quizzes/${quiz.id}`), quiz);
        }
      } catch (e) {
        console.error("Erreur sauvegarde Cloud:", e);
      }
    }
  };

  const handleGenerate = async () => {
    if (!textContent && images.length === 0) {
      setError("Veuillez fournir du contenu (texte ou images).");
      return;
    }
    if (!title) {
      setError("Veuillez donner un titre à votre quiz.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const questions = await generateQuizFromContent(textContent, images, questionCount);
      setGeneratedQuestions(questions);
      setView('REVIEW');
    } catch (err) {
      setError("Une erreur est survenue lors de la génération du quiz. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalize = async () => {
    try {
      // Reuse ID if editing, else new ID
      const quizId = initialQuiz?.id || Math.random().toString(36).substr(2, 9);

      const definition: QuizDefinition = {
        id: quizId,
        title,
        questions: generatedQuestions,
        createdAt: initialQuiz?.createdAt || Date.now(),
        originalContent: textContent // Persist content
      };

      await saveQuizToLibrary(definition);

      const session: QuizSession = {
        ...definition,
        id: Math.random().toString(36).substr(2, 9),
      };

      onQuizCreated(session);
    } catch (err) {
      console.error("Erreur sauvegarde finale", err);
      setError("Impossible de sauvegarder le quiz.");
    }
  };

  // --- MANUAL EDITING HANDLERS ---
  const handleQuestionChange = (idx: number, text: string) => {
    const newQuestions = [...generatedQuestions];
    newQuestions[idx].question = text;
    setGeneratedQuestions(newQuestions);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, text: string) => {
    const newQuestions = [...generatedQuestions];
    newQuestions[qIdx].options[oIdx] = text;
    setGeneratedQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIdx: number, oIdx: number) => {
    const newQuestions = [...generatedQuestions];
    newQuestions[qIdx].correctAnswerIndex = oIdx;
    setGeneratedQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setGeneratedQuestions([
      ...generatedQuestions,
      {
        id: Math.random().toString(36).substr(2, 9),
        question: "Nouvelle question...",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswerIndex: 0,
        explanation: "Explication..."
      }
    ]);
  };

  // --- REVIEW RENDER ---
  if (view === 'REVIEW') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">Éditeur de Quiz</h2>
          <div className="flex gap-4">
            <button onClick={() => setView('INPUT')} className="text-slate-400 hover:text-white transition-colors">← Paramètres</button>
            <button onClick={handleFinalize} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-1">
              ✅ Sauvegarder
            </button>
          </div>
        </div>

        <div className="bg-[#0f172a] p-8 rounded-3xl shadow-xl border border-slate-700 space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div className="w-full">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold text-slate-200 bg-transparent border-none outline-none w-full placeholder-slate-600 focus:ring-0"
                placeholder="Titre du Quiz"
              />
              <p className="text-slate-500 text-sm mt-1">{generatedQuestions.length} questions</p>
            </div>
          </div>

          <div className="space-y-6">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <span className="bg-cyan-500/10 text-cyan-400 font-bold px-3 py-2 rounded-lg text-sm h-fit mt-1">Q{idx + 1}</span>
                  <textarea
                    value={q.question}
                    onChange={(e) => handleQuestionChange(idx, e.target.value)}
                    className="flex-grow bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white font-bold text-lg focus:border-cyan-500 outline-none resize-y min-h-[80px]"
                  />
                  <button
                    onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                    title="Supprimer la question"
                  >
                    🗑️
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border ${i === q.correctAnswerIndex ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900/50 border-slate-700'}`}>
                      <button
                        onClick={() => handleCorrectAnswerChange(idx, i)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${i === q.correctAnswerIndex ? 'border-green-500 bg-green-500 text-white' : 'border-slate-500 hover:border-cyan-400'}`}
                        title="Définir comme bonne réponse"
                      >
                        {i === q.correctAnswerIndex && '✓'}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, i, e.target.value)}
                        className={`flex-grow bg-transparent border-none outline-none text-sm font-medium ${i === q.correctAnswerIndex ? 'text-green-300' : 'text-slate-400'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 font-bold hover:border-cyan-500 hover:text-cyan-400 transition-all flex justify-center items-center gap-2"
          >
            <span>+</span> Ajouter une question manuellement
          </button>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center text-blue-200">
            💡 Cliquez sur le cercle à gauche d'une réponse pour la définir comme correcte.
          </div>
        </div>
      </div>
    );
  }

  // --- INPUT RENDER ---
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">{initialQuiz ? 'Modifier le Quiz' : 'Créer un nouveau Quiz'}</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-cyan-400 transition-colors">Annuler</button>
      </div>

      <div className="bg-[#0f172a] p-8 rounded-3xl shadow-xl border border-slate-700 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Titre de la formation / Quiz</label>
          <input
            type="text"
            placeholder="Ex: Fondamentaux du Machine Learning"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 border border-slate-600 bg-slate-800 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all placeholder-slate-500"
          />
        </div>

        {initialQuiz && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setView('REVIEW')}
              className="col-span-2 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-600"
            >
              ✏️ Modifier les questions existantes
            </button>
          </div>
        )}

        <div className="border-t border-slate-700/50 pt-6"></div>
        <h3 className="text-lg font-bold text-white mb-2">ou Générer avec l'IA</h3>

        {initialQuiz && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-200 text-sm mb-4">
            💡 <strong>Mode Édition</strong> : Le contenu original a été rechargé ci-dessous. Si vous générez, les questions existantes seront <strong>remplacées</strong>.
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2 flex justify-between">
            <span>Nombre de questions souhaité</span>
            <span className="text-cyan-400 font-bold">{questionCount}</span>
          </label>
          <input
            type="range"
            min="3"
            max="20"
            step="1"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>3</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Support de contenu (Texte, Notes, Slides)</label>
          <textarea
            rows={10} // Increased height
            placeholder="Collez ici le texte de vos slides ou vos notes de cours..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full p-4 border border-slate-600 bg-slate-800 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all resize-none placeholder-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Ajouter des images de slides (Optionnel)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-800 border-slate-600 hover:border-cyan-500 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-slate-400 group-hover:text-cyan-400 transition-colors"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                <p className="text-xs text-slate-500">PNG, JPG ou JPEG</p>
              </div>
              <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 flex-shrink-0 group">
                  <img src={img} className="w-full h-full object-cover rounded-lg border border-slate-600" alt="Slide preview" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="p-4 bg-red-900/20 text-red-400 rounded-xl text-sm border border-red-500/30 flex items-center gap-2">⚠️ {error}</div>}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${isGenerating ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              L'IA génère votre quiz...
            </span>
          ) : "✨ Générer & Prévisualiser"}
        </button>
      </div>
    </div>
  );
};

export default QuizCreator;
