.DEFAULT_GOAL := help

.PHONY: help
help: ## Liste des commandes
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: env ## Dépendances (npm ci) et fichier .env
	npm ci

.PHONY: env
env: ## Crée .env depuis .env.example (ne touche pas à un .env existant)
	@if [ -f .env ]; then echo ".env existe déjà : conservé."; else cp .env.example .env && echo ".env créé depuis .env.example."; fi

.PHONY: install
install: ## Installe les dépendances
	npm install

.PHONY: dev
dev: ## Dev en mode PWA (installable, rechargement instantané) sur http://localhost:5190
	npm run dev

.PHONY: dev-api
dev-api: ## Dev sur les vraies données : park-finder-api doit tourner sur http://localhost:3000
	VITE_DATA_SOURCE=api npm run dev

.PHONY: preview
preview: ## Vrai test PWA : build de production + aperçu sur http://localhost:4190 (hors ligne complet)
	npm run preview:pwa

.PHONY: check
check: ## Typecheck, lint, règles d'architecture et tests (avant chaque commit)
	npm run check

.PHONY: test
test: ## Tests en continu
	npm run test:watch
