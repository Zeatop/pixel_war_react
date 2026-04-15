# Pixel War - MBDS 2025

## Equipe

- Léo JACKSON
- Aymé PIGNON
- Alex ARMATYS

## Presentation

Ce depot contient le projet Pixel War avec :

- un frontend React/Vite dans `client/`
- un backend Express/PostgreSQL dans `api/`

Fonctionnalites principales :

- authentification Google + JWT
- gestion de boards (grids/frames)
- placement de pixels avec cooldown et règles metier
- mise à jour temps reel via Socket.IO

## Documentation du projet

- Frontend: `client/README.md`
- Backend: `api/README.md`

## Demarrage rapide (depuis la racine)

```powershell
docker compose up --build
```

## Tests automatiques API (Postman)

- Collection Postman: `api/documentation/pixel-war-backend.postman_collection.json`
- Workflow GitHub Actions: `.github/workflows/backend-postman.yml`
- Le workflow tourne sur `push` et `pull_request` de `origin`, démarre `postgres` + `api` avec Docker puis lance Newman.

## Notes

- Le backend expose ses routes sous `/api`
- Le frontend consomme l'API via `VITE_API_URL`
- Endpoint de santé backend: `/health`

