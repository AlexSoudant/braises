import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { db } from './data/db';

// jsdom n'implémente pas les dialogues modaux : imitation de ce que fait le navigateur et dont l'app dépend.
const focusAvantOuverture = new WeakMap<HTMLDialogElement, Element | null>();
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  focusAvantOuverture.set(this, document.activeElement);
  this.setAttribute('open', '');
  this.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]')?.focus();
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  // Le focus n'est rendu que si le dialogue est encore dans la page au moment de sa fermeture.
  if (this.isConnected) (focusAvantOuverture.get(this) as HTMLElement | null)?.focus();
  // Comme dans le navigateur, l'événement « close » est mis en file, pas envoyé immédiatement.
  setTimeout(() => this.dispatchEvent(new Event('close')));
};

beforeEach(async () => {
  history.replaceState(null, '', '/');
  localStorage.clear();
  await db.amis.clear();
  await db.echanges.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
