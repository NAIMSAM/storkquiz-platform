
import React from 'react';
import { motion } from 'framer-motion';

interface PricingProps {
    onSelectPlan: (plan: 'FREE' | 'PRO' | 'ENTERPRISE') => void;
    onClose: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan, onClose }) => {
    const plans = [
        {
            id: 'FREE',
            name: 'Découverte',
            price: '0€',
            period: '/mois',
            description: 'Idéal pour tester la puissance de l\'IA.',
            features: [
                '3 Quiz générés par mois',
                'Jusqu\'à 50 participants par session',
                '1 session active à la fois',
                'Support communautaire'
            ],
            cta: 'Commencer Gratuitement',
            popular: false,
            color: 'slate'
        },
        {
            id: 'PRO',
            name: 'Formateur Pro',
            price: '29€',
            period: '/mois',
            description: 'Pour les formateurs indépendants et consultants.',
            features: [
                '50 Quiz générés par mois',
                'Jusqu\'à 500 participants',
                '5 sessions actives simultanées',
                'Export des résultats (PDF/Excel)',
                'Support prioritaire',
                'Personnalisation du logo'
            ],
            cta: 'Passer Pro',
            popular: true,
            color: 'cyan'
        },
        {
            id: 'ENTERPRISE',
            name: 'Business',
            price: 'Sur Mesure',
            period: '',
            description: 'Pour les organismes de formation et écoles.',
            features: [
                'Quiz illimités',
                'Participants illimités',
                'Sessions illimitées',
                'API & Intégrations (LMS)',
                'SSO / SAML',
                'Manager de compte dédié'
            ],
            cta: 'Contacter les ventes',
            popular: false,
            color: 'purple'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative w-full max-w-6xl mx-auto z-10 animate-fadeIn my-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Passez à la vitesse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Supérieure</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Choisissez le plan adapté à vos besoins de formation. Annulez à tout moment.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative bg-[#0f172a] rounded-3xl p-8 border ${plan.popular ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.15)]' : 'border-slate-800'} flex flex-col h-full hover:transform hover:scale-105 transition-all duration-300`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    LE PLUS POPULAIRE
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-300'}`}>{plan.name}</h3>
                                <div className="flex items-baseline mt-2">
                                    <span className="text-4xl font-black text-white">{plan.price}</span>
                                    <span className="text-slate-500 ml-2">{plan.period}</span>
                                </div>
                                <p className="text-slate-400 mt-4 text-sm leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="flex-grow space-y-4 mb-8">
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                        <span className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${plan.popular ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>✓</span>
                                        {feat}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => onSelectPlan(plan.id as any)}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${plan.popular
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/25 shadow-lg'
                                        : 'bg-slate-800 text-white hover:bg-slate-700'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center text-slate-500 text-sm">
                    <button onClick={onClose} className="hover:text-white transition-colors underline">
                        Non merci, je continue avec l'offre gratuite pour l'instant
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
