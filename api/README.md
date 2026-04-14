# Pixel War - Backend API

## Equipe

- Léo JACKSON
- Aymé PIGNON
- Alex ARMATYS

## Vue d'ensemble

Le backend est une API **Express + TypeScript** connectee a **PostgreSQL**.
Son role est de gerer les grilles et leurs frames pour la Pixel War.

## Architecture

- `src/index.ts` : demarrage serveur + middlewares + initialisation DB
- `src/api.ts` : routeur principal `/api`
- `src/routes/pixelWarRoutes.ts` : routes HTTP exposees au frontend
- `src/services/gridService.ts` : logique metier et requetes SQL
- `src/db/pool.ts` : connexion PostgreSQL (`pg`)
- `src/db/initDb.ts` : creation des tables si absentes

## Base de donnees

Tables creees automatiquement au demarrage :

- `grids` : metadonnees de grille (`id`, `name`, `width`, `height`, `created_at`)
- `frames` : cases de la grille (`grid_id`, `x`, `y`, `color`, `created_at`)

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

