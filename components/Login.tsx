import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            toast.error("Service d'authentification indisponible");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Connexion réussie !");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                toast.success("Compte créé avec succès !");
            }
            onLoginSuccess();
        } catch (error: any) {
            console.error("Auth Error:", error);
            let message = "Une erreur est survenue.";
            if (error.code === 'auth/wrong-password') message = "Mot de passe incorrect.";
            if (error.code === 'auth/user-not-found') message = "Utilisateur inconnu.";
            if (error.code === 'auth/email-already-in-use') message = "Cet email est déjà utilisé.";
            if (error.code === 'auth/weak-password') message = "Le mot de passe doit contenir au moins 6 caractères.";
            if (error.code === 'auth/invalid-credential') message = "Identifiants invalides.";

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 via-[#0a0f1e] to-black text-white overflow-hidden relative">

            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
            >
                <div className="text-center mb-8">
                    <img src="/stork-logo.png" alt="Logo" className="h-16 mx-auto mb-4 drop-shadow-lg" />
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        {isLogin ? 'Bienvenue' : 'Créer un compte'}
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {isLogin ? 'Accédez à votre espace Formateur Pro' : 'Rejoignez la plateforme StorkQuiz AI'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                            placeholder="votre@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Mot de passe</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-3.5 rounded-lg font-bold text-lg shadow-lg transition-all ${loading
                                ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/25 text-white'
                            }`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Traitement...
                            </span>
                        ) : (
                            isLogin ? 'Se connecter' : "S'inscrire"
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-slate-400 text-sm">
                        {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                        >
                            {isLogin ? "S'inscrire" : "Se connecter"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
