import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@ui/app/app';
import '@ui/theme/global.css';
import { CanonicalOrigin } from './canonical-origin';
import { createContainer } from './container';
import { readEnv } from './env';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Élément #root introuvable dans index.html.');

const env = readEnv();
const canonicalUrl = new CanonicalOrigin(env.canonicalOrigin).redirectTarget(window.location);

if (canonicalUrl) {
  window.location.replace(canonicalUrl);
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App container={createContainer(env)} />
    </StrictMode>,
  );
}
