import { useCallback } from 'react';

/**
 * Ref callback qui publie la hauteur de l'élément dans une variable CSS de son parent.
 * Sert à placer des éléments tiers (contrôles MapLibre) au-dessus d'un panneau de hauteur variable.
 */
export function useHeightCssVariable<T extends HTMLElement>(variableName: `--${string}`) {
  return useCallback(
    (element: T | null) => {
      const parent = element?.parentElement;
      if (!element || !parent) return;

      const observer = new ResizeObserver(() => {
        parent.style.setProperty(variableName, `${element.getBoundingClientRect().height}px`);
      });
      observer.observe(element);

      return () => {
        observer.disconnect();
        parent.style.removeProperty(variableName);
      };
    },
    [variableName],
  );
}
