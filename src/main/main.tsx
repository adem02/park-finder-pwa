import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@ui/app/app';
import '@ui/theme/global.css';
import { createContainer } from './container';
import { readEnv } from './env';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Élément #root introuvable dans index.html.');

const container = createContainer(readEnv());

createRoot(rootElement).render(
  <StrictMode>
    <App container={container} />
  </StrictMode>,
);
