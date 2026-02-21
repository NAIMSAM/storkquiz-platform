# Étape 1 : Construction
FROM node:20-alpine AS builder

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source
COPY . .

# Construction pour la production (plus besoin des variables ici)
RUN npm run build

# Étape 2 : Serveur Web
FROM nginx:alpine

# Copie de la configuration Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers construits depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Ajout du script d'entrypoint pour l'injection des variables d'environnement
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
