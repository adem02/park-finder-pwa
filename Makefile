.DEFAULT_GOAL := help

.PHONY: help
help: ## Liste des commandes
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Installe les dépendances
	npm install

.PHONY: dev
dev: ## Dev en mode PWA (installable, rechargement instantané) sur http://localhost:5190
	npm run dev

.PHONY: preview
preview: ## Vrai test PWA : build de production + aperçu sur http://localhost:4190 (hors ligne complet)
	npm run preview:pwa

.PHONY: check
check: ## Typecheck, lint, règles d'architecture et tests (avant chaque commit)
	npm run check

.PHONY: test
test: ## Tests en continu
	npm run test:watch
