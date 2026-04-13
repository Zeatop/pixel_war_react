# Pixel War React

Projet **Pixel War** réalisé par **Léo JACKSON, Aymé PIGNON et Alex ARMATYS**.

URL Repo : https://github.com/Zeatop/pixel_war_react

## À propos

Cette application est une interface web développée avec **React**, **TypeScript** et **Vite**.
Elle sert de front-end pour le projet Pixel War et propose notamment :

- une page d’accueil (`Home`)
- une page de connexion (`Login`)
- un tableau de bord / board (`Board`)
- un profil utilisateur (`Profile`)
- une zone d’administration (`Admin`)

L’application utilise aussi :

- `react-router-dom` pour la navigation
- `@tanstack/react-query` pour la gestion des requêtes
- `@react-oauth/google` pour l’authentification Google
- Sass pour certains styles

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- Un terminal PowerShell ou un terminal compatible Docker

## Lancer le projet avec Docker

Le projet peut être démarré directement avec le `Dockerfile`.

```powershell
docker build -t pixel-war-react .
docker run --rm -p 5173:5173 pixel-war-react
```

Ensuite, ouvrez :

```text
http://localhost:5173
```

## Lancer le projet avec Docker Compose

Le dépôt contient aussi un fichier `docker-compose.yml` pour simplifier le lancement.

```powershell
docker compose up --build
```

Ou, avec l’ancienne commande :

```powershell
docker-compose up --build
```

Pour arrêter le service :

```powershell
docker compose down
```

## Structure du projet

- `src/pages` : pages principales de l’application
- `src/components` : composants réutilisables
- `src/contexts` : contextes React pour l’authentification et le thème
- `src/frontend` : composants liés à l’affichage du pixel art et à la grille
- `src/services` : appels API

## Développement local

Si vous souhaitez lancer l’application sans Docker :

```powershell
npm install
npm run dev
```

L’application sera alors accessible sur le port indiqué par Vite.

