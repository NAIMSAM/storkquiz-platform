
import { db, ref, set, onValue } from './firebase';
import { User } from 'firebase/auth';
import { UserProfile, SubscriptionTier, TIER_LIMITS } from '../types';

/**
 * Charge ou Crée le profil utilisateur dans la DB
 */
export const syncUserProfile = async (firebaseUser: User): Promise<void> => {
    const userRef = ref(db, `users/${firebaseUser.uid}/profile`);

    return new Promise((resolve) => {
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();

            if (!data) {
                // Create new Freemium profile
                const newProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    subscriptionTier: SubscriptionTier.FREE,
                    createdAt: Date.now(),
                    lastLogin: Date.now(),
                    limits: TIER_LIMITS[SubscriptionTier.FREE],
                    usage: {
                        quizzesCreated: 0,
                        aiGenerationsUsed: 0
                    }
                };
                set(userRef, newProfile);
                resolve();
            } else {
                // Update last Login
                set(ref(db, `users/${firebaseUser.uid}/profile/lastLogin`), Date.now());
                resolve();
            }
        }, { onlyOnce: true });
    });
};

/**
 * Hook ou fonction pour écouter les changements de profil
 */
export const subscribeToProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
    const userRef = ref(db, `users/${uid}/profile`);
    return onValue(userRef, (snapshot) => {
        callback(snapshot.val());
    });
};

/**
 * Vérifie si une action est autorisée selon les quotas
 */
export const checkLimit = (profile: UserProfile, type: 'create_quiz' | 'ai_generation'): boolean => {
    if (profile.subscriptionTier === SubscriptionTier.ENTERPRISE) return true;

    if (type === 'create_quiz') {
        return profile.usage.quizzesCreated < profile.limits.maxQuizzes;
    }

    if (type === 'ai_generation') {
        return profile.usage.aiGenerationsUsed < profile.limits.aiGenerationLimit;
    }

    return false;
};
