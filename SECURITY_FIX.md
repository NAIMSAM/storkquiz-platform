# 🚨 PROCÉDURE D'URGENCE : SÉCURISER VOS CLÉS API

Suivez ces étapes **dans l'ordre** pour remplacer vos clés compromises par des neuves.

## 1️⃣ Sur Google Cloud (Révoquer & Recréer)

1.  Ouvrez ce lien : **[Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=formation-458409)**.
2.  Dans la liste **"Clés API"**, repérez vos clés actuelles (ex: "Browser key", "Auto created key").
3.  🗑️ **Supprimez-les** toutes (Cliquez sur la corbeille à droite de chaque ligne).
    *   *Cela coupe l'accès instantanément aux hackers qui auraient vos clés.*
4.  ➕ Cliquez sur **"CRÉER DES IDENTIFIANTS"** (en haut) > **"Clé API"**.
5.  Une fenêtre s'ouvre avec votre **Nouvelle Clé** (ex: `AIzaSyD...`).
    *   👉 **Copiez cette clé** dans un bloc-notes temporaire.
    *   On l'appellera **`MA_NOUVELLE_CLE`**.

*(Répétez l'étape 4 si vous aviez plusieurs clés distinctes, mais une seule suffit généralement pour tout).*

---

## 2️⃣ Sur votre PC (Mise à jour Locale)

1.  Ouvrez VS Code.
2.  Ouvrez le fichier **`.env`** (à la racine du projet).
3.  Remplacez **toutes** les anciennes clés par **`MA_NOUVELLE_CLE`**.
    *   Exemple :
        ```env
        VITE_FIREBASE_API_KEY=AIzaSyD... (votre nouvelle clé)
        GEMINI_API_KEY=AIzaSyD... (votre nouvelle clé)
        ```
4.  Sauvegardez (`Ctrl+S`).
    *   ✅ Comme j'ai sécurisé le projet, ce fichier ne sera **PLUS JAMAIS** envoyé sur GitHub. Il reste privé sur votre PC.

---

## 3️⃣ Sur Cloud Run (Mise à jour Production)

Puisque le fichier `.env` est privé, Google Cloud ne le connait pas. Il faut lui donner les clés manuellement.

1.  Allez sur la **[Console Cloud Run](https://console.cloud.google.com/run?project=formation-458409)**.
2.  Cliquez sur votre service **`storkquiz-platform`**.
3.  Cliquez sur le bouton **"MODIFIER ET DÉPLOYER UNE NOUVELLE RÉVISION"** (en haut de la page).
4.  Allez dans l'onglet **"Conteneur"** (Container).
5.  Descendez jusqu'à la section **"Variables d'environnement"**.
6.  Cliquez sur **"AJOUTER UNE VARIABLE"** pour chaque ligne de votre fichier `.env`.
    *   *Nom 1* : `VITE_FIREBASE_API_KEY`  |  *Valeur 1* : `AIzaSyD...` (votre nouvelle clé)
    *   *Nom 2* : `GEMINI_API_KEY`         |  *Valeur 2* : `AIzaSyD...`
    *   *Nom 3* : `VITE_FIREBASE_AUTH_DOMAIN` | *Valeur 3* : `studio-2167306322-7b8c9.firebaseapp.com`
    *   *(Continuez pour toutes les variables du fichier .env)*
7.  Cliquez sur **DÉPLOYER** (tout en bas).

🎉 **C'est fini !**
Votre application va redémarrer avec les nouvelles clés sécurisées. Les anciennes clés qui traînent sur GitHub ne servent plus à rien (elles sont désactivées).
