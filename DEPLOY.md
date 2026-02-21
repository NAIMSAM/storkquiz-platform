# 🚀 Guide de Déploiement Production - StorkQuiz AI

Ce guide vous explique comment déployer votre application StorkQuiz sur un serveur public (VPS, AWS, DigitalOcean, OVH, etc.).

## 📋 Pré-requis

1.  **Un Serveur Linux** (Ubuntu 20.04 ou 22.04 recommandé).
2.  **Un Nom de Domaine** (ex: `mon-quiz-ai.com`) - *Optionnel mais recommandé*.
3.  **Accès SSH** au serveur.

---

## 1️⃣ Préparer les fichiers

Exécutez le script `package_deploy.bat` (que je viens de créer) à la racine du projet sur votre Windows.
Il va créer un dossier `storkquiz-deploy` contenant uniquement le nécessaire.

---

## 2️⃣ Configurer le Serveur (Une seule fois)

Connectez-vous à votre serveur en SSH :
```bash
ssh root@votre-ip-serveur
```

Installez Docker et Docker Compose (si ce n'est pas déjà fait) :
```bash
# Mettre à jour
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Vérifier l'installation
docker --version
docker compose version
```

---

## 3️⃣ Transférer l'application

Depuis votre ordinateur (Windows), copiez le contenu du dossier `storkquiz-deploy` vers le serveur.
Vous pouvez utiliser **FileZilla** ou la commande `scp` :

```powershell
# Commande à lancer depuis Windows (PowerShell)
scp -r .\storkquiz-deploy\* root@votre-ip-serveur:/opt/storkquiz
```

---

## 4️⃣ Lancer l'application

Sur le serveur (SSH) :

```bash
cd /opt/storkquiz

# (Optionnel) Éditez le fichier .env pour la prod
nano .env 

# Lancer le service
docker compose up -d --build
```

Votre application est maintenant accessible sur `http://votre-ip-serveur` ! 🚀

---

## 🔒 Sécurisation (HTTPS / SSL)

Pour avoir le cadenas vert (HTTPS), vous devrez modifier `nginx.conf` ou utiliser un reverse-proxy comme Traefik ou Caddy.
Le plus simple est d'utiliser un outil comme **Nginx Proxy Manager** devant votre conteneur.
