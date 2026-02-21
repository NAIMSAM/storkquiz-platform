# 🚀 Déploiement Automatisé via GitHub (CI/CD)

Cette méthode est la plus professionnelle. Elle permet de mettre à jour votre site simplement en faisant un "Push" sur GitHub.

## 1️⃣ Créer le Repository GitHub

1.  Allez sur [GitHub.com](https://github.com/new).
2.  Créez un nouveau repository (ex: `storkquiz-platform`).
3.  Ne cochez **RIEN** (pas de README, pas de .gitignore, pas de licence).
4.  Cliquez sur **Create repository**.

## 2️⃣ Pousser le Code (depuis votre terminal VS Code)

Copiez-collez ces commandes une par une en remplaçant `VOTRE_NOM_UTILISATEUR` par votre pseudo GitHub :

```bash
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/storkquiz-platform.git
git branch -M main
git push -u origin main
```

*(Si une fenêtre de connexion GitHub s'ouvre, connectez-vous).*

---

## 3️⃣ Connecter à Cloud Run (Magie 🪄)

Une fois le code sur GitHub :

1.  Allez sur la page [Cloud Run de votre projet](https://console.cloud.google.com/run?project=formation-458409).
2.  Cliquez sur **"Créer un service"** (ou "Create Service").
3.  Sélectionnez **"Déployer en continu à partir d'un dépôt source"** (Continuous Deployment).
4.  Cliquez sur **"Configurer Cloud Build"**.
5.  Sélectionnez votre repository **GitHub** (`storkquiz-platform`).
6.  Configuration du build :
    *   **Dockerfile** (laissez par défaut).
    *   Emplacement : `Dockerfile` (laissez tel quel).
7.  Cliquez sur **Enregistrer** puis **Créer**.

---

## 4️⃣ C'est tout !

Désormais, à chaque fois que vous ferez une modification et un :
```bash
git add .
git commit -m "update"
git push
```
... Google Cloud récupérera le code, reconstruira le site et le mettra en ligne automatiquement ! 🚀
