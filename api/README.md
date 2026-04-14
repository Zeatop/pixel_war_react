# Pixel War - Backend API

## Equipe

- Léo JACKSON
- Aymé PIGNON
- Alex ARMATYS

## Vue d'ensemble

Le backend est une API **Express + TypeScript** connectee a **PostgreSQL**.
Son role est de gerer les grilles et leurs frames pour la Pixel War.

Nouveautes:

- Authentification Google (JWT)
- Regles PixelBoard (cooldown, date de fin, overwrite)
- Temps reel via WebSocket (Socket.IO)

## Architecture

- `src/index.ts` : demarrage serveur + middlewares + initialisation DB
- `src/api.ts` : routeur principal `/api`
- `src/routes/pixelWarRoutes.ts` : routes HTTP exposees au frontend
- `src/routes/authRoutes.ts` : routes d'authentification Google
- `src/services/gridService.ts` : logique metier et requetes SQL
- `src/services/authService.ts` : verification Google + creation utilisateur + JWT
- `src/services/realtimeService.ts` : diffusion temps reel des pixels
- `src/db/pool.ts` : connexion PostgreSQL (`pg`)
- `src/db/initDb.ts` : creation des tables si absentes

## Base de donnees

Tables creees automatiquement au demarrage :

- `grids` : metadonnees de grille (`id`, `name`, `width`, `height`, `created_at`)
- `frames` : cases de la grille (`grid_id`, `x`, `y`, `color`, `created_at`)
- `users` : utilisateurs Google persistes (`google_sub`, `email`, `name`, `avatar_url`)
- `pixel_placements` : historique des contributions (utile pour cooldown)

Lors d'un `createGrid`, toutes les frames sont initialisees en blanc (`#FFFFFF`).

## Routes API

Base URL: `http://localhost:8000/api`

### `POST /createGrid`
Cree une grille et toutes ses frames blanches.

Exemple body:

```json
{
  "width": 5,
  "height": 4,
  "name": "ma-grille"
}
```

Reponse `201`:

```json
{
  "grid": {
    "id": 1,
    "name": "ma-grille",
    "width": 5,
    "height": 4,
    "createdAt": "2026-04-14T08:00:00.000Z"
  },
  "frames": [
    { "id": 1, "gridId": 1, "x": 0, "y": 0, "color": "#FFFFFF", "createdAt": "..." }
  ]
}
```

### `GET /getAllFrames/:gridId`
Retourne les infos de la grille + toutes les frames.

### `GET /getFrame/:gridId/:x/:y`
Retourne une frame pour des coordonnees donnees.

### `POST /auth/google`
Authentifie un utilisateur depuis un token Google et retourne `{ user, token }`.

### `GET /auth/me`
Retourne l'utilisateur courant (JWT requis).

### `GET /boards`
Retourne la liste des boards (`?status=in_progress|finished` optionnel).

### `GET /boards/:gridId/state`
Retourne metadata + pixels du board.

### `POST /boards/:gridId/pixels`
Pose un pixel (JWT requis) avec validations:

- board en cours
- date de fin non atteinte
- cooldown respecte
- couleur autorisee
- overwrite selon la configuration du board

## WebSocket

Evenements Socket.IO:

- client -> serveur: `board.join`, `board.leave`
- serveur -> clients: `pixel.placed`, `board.ended`

## Codes de retour

- `200` : succes
- `201` : ressource creee
- `400` : parametres invalides
- `404` : grille/frame introuvable
- `500` : erreur serveur

## Variables d'environnement

- `PORT` (defaut `8000`)
- `POSTGRES_HOST` (defaut `localhost`)
- `POSTGRES_PORT` (defaut `5432`)
- `POSTGRES_DB` (defaut `pixel_war`)
- `POSTGRES_USER` (defaut `pixelUser`)
- `POSTGRES_PASSWORD` (defaut `pixelMDP`)
- `JWT_SECRET` (recommande en production)
- `GOOGLE_CLIENT_ID` (optionnel mais recommande pour verifier `aud`)

## Lancer le backend en local

```powershell
docker compose up -d postgres
Push-Location .\api
npm install
npm run dev
Pop-Location
```

## Build backend

```powershell
Push-Location .\api
npm run build
Pop-Location
```

## Liens utiles

- README global du projet: `../README.md`
- README frontend: `../client/README.md`

