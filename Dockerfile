# Étape 1 : Construction
FROM node:20-alpine AS builder

WORKDIR /app

# Déclaration des variables de build (Firebase config)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_DATABASE_URL
ARG GEMINI_API_KEY

# Exposition au build Vite via ENV
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_DATABASE_URL=$VITE_FIREBASE_DATABASE_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source
COPY . .

# Construction pour la production (les variables ENV sont maintenant disponibles)
RUN npm run build

# Étape 2 : Serveur Web
FROM nginx:alpine

# Copie de la configuration Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers construits depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
