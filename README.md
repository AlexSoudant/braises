# Braises

Garde tes amitiés au chaud. Une web app installable qui montre, pour chaque ami, le temps écoulé depuis votre dernier échange, coloré selon le Rythme que tu souhaites avec cette personne.

En chantier : la version React est publiée en continu sur https://alexsoudant.github.io/braises/. La première version (JS natif) est archivée sur la branche `prototype`.

## Développer

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173/braises/.

```bash
npm test        # Vitest : logique et parcours d'écran
npm run lint    # ESLint + Prettier
npm run build   # vérification des types puis build dans dist/
```

## Structure

- `src/domain/` : logique pure (Chaleur, anniversaires, tri), sans base ni DOM.
- `src/data/` : seul accès à la base (Dexie / IndexedDB).
- `src/ui/` : écrans React, stylés avec Tailwind (thème dans `src/index.css`).
- `GLOSSARY.md` : vocabulaire du domaine. `docs/adr/` : décisions d'architecture.

Chaque push sur `main` lance lint, tests et build dans GitHub Actions, puis publie sur Pages si tout passe.

## La Chaleur

`jours depuis le dernier échange / Rythme` :

| Rapport                    | Niveau   |
| -------------------------- | -------- |
| < 0,5                      | Brûlant  |
| < 1                        | Chaud    |
| < 1,5                      | Tiède    |
| < 2,5                      | Refroidi |
| sinon, ou jamais d'échange | Glacé    |
