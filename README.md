# ParkFinder PWA

Application web progressive pour trouver des parkings gratuits, ville pilote : Reims.
Remplace l'app Expo `park-finder-app`. L'API reste `park-finder-api` (NestJS).

## Démarrer

```bash
nvm use            # Node 22
npm install
cp .env.example .env
npm run dev        # http://localhost:5190
```

Par défaut, l'app tourne en **mode démo** : les 91 parkings gratuits de Reims issus d'OpenStreetMap
sont en mémoire, avec des signalements fictifs, et l'utilisateur est placé au centre de Reims.
Le mode `api` (`VITE_DATA_SOURCE=api`) attend l'écran de connexion, car `GET /parkings` exige un JWT.

## Commandes

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Typecheck puis build de production (avec service worker) |
| `npm run preview` | Sert le build, pour tester la PWA |
| `npm run check` | Typecheck, lint, règles d'architecture et tests : à lancer avant chaque commit |
| `npm run test` | Tests Vitest |
| `npm run lint:arch` | Règles d'import entre couches (dependency-cruiser) |
| `npm run seed:demo` | Régénère les données de démo depuis `../parkings-data/` |

## Architecture

Clean Architecture stricte, POO par défaut. Les dépendances pointent vers le centre :

```
main/ ──► ui/ ─────────────┐
   └────► infrastructure/ ─┴──► application/ ──► domain/
```

| Couche | Contient | Peut importer |
|--------|----------|---------------|
| `src/domain/` | Entités et value objects immuables, règles métier pures | rien d'autre |
| `src/application/` | Use cases (`*.use-case.ts`), ports (interfaces), erreurs | `domain/` |
| `src/infrastructure/` | Adapters : HTTP + DTO Zod + mappers, géolocalisation, horloge, fakes en mémoire | `application/`, `domain/` |
| `src/ui/` | React, routes TanStack Router, cache TanStack Query, carte MapLibre, CSS Modules | `application/`, `domain/` |
| `src/main/` | Composition root : instancie et câble tout | tout |

Ces règles sont vérifiées par `npm run lint:arch` (`.dependency-cruiser.cjs`).

Règles à retenir :
- Une erreur attendue est un `Result` (`ok` / `err`) qui porte une classe d'erreur avec un `kind`. Les exceptions sont réservées aux bugs.
- Le cache TanStack Query stocke des **snapshots** sérialisables (`entity.toSnapshot()`), et les hooks réhydratent l'entité avec `select: Entity.fromSnapshot`.
- `MapView` est le seul composant qui connaît MapLibre. Le reste de l'UI lui passe du GeoJSON via `ParkingFeaturePresenter`.
- Les tests vivent dans `test/unit/<couche>/`, avec des builders dans `test/support/`.

## Données et licences

- Fond de carte : [OpenFreeMap](https://openfreemap.org), sans clé.
- Données de démo : © contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright), licence ODbL.
