import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { vi } from 'vitest';
import { App } from '../App';

/**
 * Rend l'app entière comme si on était le jour donné, en StrictMode comme dans `main.tsx`.
 * La base est vidée avant chaque test (test-setup).
 */
export function afficherApp(aujourdhui: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(aujourdhui);
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/** Simule un retour au premier plan, éventuellement un autre jour. */
export function revenirAuPremierPlan(jour: Date) {
  vi.setSystemTime(jour);
  document.dispatchEvent(new Event('visibilitychange'));
}
