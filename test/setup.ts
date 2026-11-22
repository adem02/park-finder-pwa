import '@testing-library/jest-dom/vitest';

// jsdom n'implémente pas showModal/close de <dialog> : version minimale pour les tests.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// jsdom n'implémente pas le défilement : la restauration de scroll du routeur l'appelle à chaque navigation.
if (typeof window !== 'undefined') {
  window.scrollTo = () => undefined;
}
