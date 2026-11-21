/**
 * Règles d'import de la Clean Architecture (voir docs/decisions.md du projet).
 * Les dépendances pointent vers le centre : main → ui / infrastructure → application → domain.
 * Lancé par `npm run lint:arch`, bloquant en CI.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'domain/ ne dépend que de lui-même : ni bibliothèque, ni navigateur, ni autre couche.',
      from: { path: '^src/domain' },
      to: { pathNot: '^src/domain' },
    },
    {
      name: 'application-depends-on-domain-only',
      severity: 'error',
      comment: 'application/ ne connaît que domain/ et ses propres ports.',
      from: { path: '^src/application' },
      to: { pathNot: '^src/(application|domain)' },
    },
    {
      name: 'infrastructure-ignores-ui',
      severity: 'error',
      comment: 'infrastructure/ implémente les ports, elle ne connaît pas ui/ ni main/.',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/(ui|main)' },
    },
    {
      name: 'ui-ignores-infrastructure',
      severity: 'error',
      comment: 'ui/ passe par les use cases, jamais par un adapter.',
      from: { path: '^src/ui' },
      to: { path: '^src/(infrastructure|main)' },
    },
    {
      name: 'nobody-imports-main',
      severity: 'error',
      comment: 'main/ est le composition root : rien ne doit en dépendre.',
      from: { pathNot: '^src/main' },
      to: { path: '^src/main' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true, pathNot: '^virtual:' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
