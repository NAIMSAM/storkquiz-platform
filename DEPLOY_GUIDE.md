# 🚀 Guide de Déploiement Cloud Run — Pas à Pas

## Contexte
Le code de StorkQuiz est sur GitHub (privé). Pour le déployer, on utilise **Cloud Build** qui va :
1. Récupérer le code depuis GitHub
2. Construire l'application (en injectant les clés API **de façon sécurisée**)
3. Déployer automatiquement sur Cloud Run

---

## PARTIE A — Supprimer l'ancien trigger (celui qui ne marche pas)

### A1. Ouvrir Cloud Build
- Ouvrez votre navigateur
- Allez sur : https://console.cloud.google.com/cloud-build/triggers?project=formation-458409
- Vous devriez voir une page avec "Déclencheurs" et un ou plusieurs triggers listés

### A2. Supprimer l'ancien trigger
- Vous verrez un trigger existant (probablement nommé "storkquiz-platform" ou similaire)
- À droite de ce trigger, cliquez sur les **3 petits points** (⋮)
- Cliquez sur **"Supprimer"**
- Confirmez la suppression

---

## PARTIE B — Créer le nouveau trigger

### B1. Cliquer sur "Créer un déclencheur"
- En haut de la page, cliquez sur le bouton **"+ CRÉER UN DÉCLENCHEUR"**

### B2. Remplir le formulaire — Section "Nom"
- **Nom** : tapez `storkquiz-deploy`
- **Région** : laissez `global` ou choisissez `europe-west1`

### B3. Section "Événement"
- Cochez **"Push vers une branche"** (c'est souvent déjà coché par défaut)

### B4. Section "Source"
- **Dépôt** : cliquez sur "Connecter un dépôt" ou sélectionnez `NAIMSAM/storkquiz-platform`
  - Si votre repo n'apparaît pas, cliquez "Connecter un nouveau dépôt" > GitHub > Autorisez > Sélectionnez `storkquiz-platform`
- **Branche** : tapez `^main$` (ou sélectionnez `main` dans la liste)

### B5. Section "Configuration" ⚠️ TRÈS IMPORTANT
- Vous verrez plusieurs options :
  - ❌ "Dockerfile" ← NE PAS choisir ça
  - ❌ "Buildpack" ← NE PAS choisir ça
  - ✅ **"Fichier de configuration Cloud Build (yaml ou json)"** ← CHOISIR CELUI-CI
- **Emplacement** : laissez `/cloudbuild.yaml` (c'est la valeur par défaut)

### B6. Section "Variables de substitution" ⚠️ TRÈS IMPORTANT
- Descendez jusqu'à trouver la section **"Variables de substitution"**
- Cliquez sur **"+ AJOUTER UNE VARIABLE"** pour chaque ligne ci-dessous
- Ajoutez ces 8 variables **une par une** :

| Cliquez + | Variable (colonne de gauche) | Valeur (colonne de droite) |
|---|---|---|
| 1 | `_VITE_FIREBASE_API_KEY` | `AIzaSyDF8ajZYiaosU-_Csm44_vUBxDO6V1GCzw` |
| 2 | `_VITE_FIREBASE_AUTH_DOMAIN` | `studio-2167306322-7b8c9.firebaseapp.com` |
| 3 | `_VITE_FIREBASE_PROJECT_ID` | `studio-2167306322-7b8c9` |
| 4 | `_VITE_FIREBASE_STORAGE_BUCKET` | `studio-2167306322-7b8c9.firebasestorage.app` |
| 5 | `_VITE_FIREBASE_MESSAGING_SENDER_ID` | `797457788026` |
| 6 | `_VITE_FIREBASE_APP_ID` | `1:797457788026:web:588aa7f2c01bbf7f939fc3` |
| 7 | `_VITE_FIREBASE_DATABASE_URL` | `https://studio-2167306322-7b8c9-default-rtdb.europe-west1.firebasedatabase.app/` |
| 8 | `_GEMINI_API_KEY` | `AIzaSyDF8ajZYiaosU-_Csm44_vUBxDO6V1GCzw` |

> ⚠️ Attention : chaque nom de variable commence par un underscore `_`

### B7. Cliquer sur "Créer"
- Descendez tout en bas
- Cliquez sur le bouton bleu **"CRÉER"**

---

## PARTIE C — Lancer le premier build

### C1. Exécuter le trigger
- Vous revenez sur la page des triggers
- Votre nouveau trigger `storkquiz-deploy` apparaît
- À droite, cliquez sur **"Exécuter"** (ou "Run")
- Cliquez sur **"Exécuter le déclencheur"** dans la popup

### C2. Surveiller le build
- Cliquez sur [Historique](https://console.cloud.google.com/cloud-build/builds?project=formation-458409)
- Vous verrez un build en cours (icône qui tourne)
- Cliquez dessus pour voir les logs en temps réel
- Le build prend environ **3-5 minutes**
- Quand tout est vert ✅, c'est déployé !

### C3. Vérifier
- Allez sur [Cloud Run](https://console.cloud.google.com/run?project=formation-458409)
- Cliquez sur `storkquiz-platform`
- L'URL en haut est votre site : ouvrez-la et testez !

---

## En cas de problème
- Si le build échoue, cliquez sur le build en erreur pour voir les logs
- Faites-moi une capture d'écran des logs et je vous aide
