# Pixel War - Frontend

## Equipe

- Léo JACKSON
- Aymé PIGNON
- Alex ARMATYS

## Vue d'ensemble

Le frontend est une application **React + TypeScript + Vite**.
Il consomme l'API du projet pour afficher les pages (home, login, board, profil, admin) et interagir avec les données de la Pixel War.

Nouveautes:

- Connexion Google (JWT backend)
- Mise a jour board en temps reel via Socket.IO
- Placement de pixels avec gestion des erreurs de cooldown/statut

## Comment le frontend fonctionne

- `src/main.tsx` monte l'application React.
- `src/App.tsx` configure le routing, React Query, les providers de thème/auth et Google OAuth.
- `src/config.ts` centralise la configuration frontend (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`).
- `src/services/api.ts` expose le client Axios vers le backend.
- `src/services/socket.ts` gere la connexion websocket et les rooms de board.
- `src/contexts/*` gère l'état global (authentification, thème).
- `src/pages/*` contient les pages principales.
- `src/frontend/*` contient les composants métier liés à la grille/pixels.

Etat actuel des pages:

- `Board` est branchee sur l'API (`/boards/:gridId/state`, placement pixel, websocket)
- `Login` est branche sur l'auth Google/JWT
- `Home`, `Admin` et `Profile` contiennent encore des blocs placeholder pour certaines donnees metier

## Prerequis

- Node.js 20.19+ (ou 22.12+) recommande pour Vite actuel
- npm
- (optionnel) Docker Desktop

## Variables d'environnement

Le frontend lit des variables `VITE_*` (standard Vite) :

- `VITE_API_URL` (exemple: `http://localhost:8000/api`)
- `VITE_GOOGLE_CLIENT_ID`

Vous pouvez les definir dans un fichier `.env` dans le dossier `client/`.

## Lancement en local

```powershell
Push-Location .\client
npm install
npm run dev
Pop-Location
```

## Build production

```powershell
Push-Location .\client
npm run build
Pop-Location
```

## Lancement via Docker Compose (depuis la racine)

```powershell
docker compose up --build
```

## Liens utiles

- README global du projet: `../README.md`
- README backend: `../api/README.md`
- Collection Postman backend: `../api/documentation/pixel-war-backend.postman_collection.json`
