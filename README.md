# Braises

Garde tes amitiés au chaud. Une web app installable qui montre, pour chaque ami, le temps écoulé depuis votre dernier échange, coloré selon le rythme que tu souhaites avec cette personne.

## Lancer en local

```bash
npm start
```

Puis ouvre http://localhost:5173. Aucune dépendance à installer.

```bash
npm test
```

## Structure

- `js/model.js` : logique pure (chaleur, anniversaires, tri). C'est elle qui est testée.
- `js/store.js` : sauvegarde dans le navigateur (`localStorage`), export et import JSON.
- `js/app.js` : interface (liste « Registre » et fiche ami).
- `sw.js` : cache hors ligne. **Incrémente `VERSION` à chaque mise en ligne.**

## La chaleur

`jours depuis le dernier échange / rythme souhaité` :

| Rapport | Niveau |
|---|---|
| < 0,5 | Brûlant |
| < 1 | Chaud |
| < 1,5 | Tiède |
| < 2,5 | Refroidi |
| sinon, ou jamais d'échange | Glacé |

## Installer sur le téléphone

L'installation demande que l'app soit servie en HTTPS (GitHub Pages, Netlify, Cloudflare Pages…). Il suffit de publier le dossier tel quel, sans étape de build.

- **iPhone** : ouvrir l'adresse dans Safari, puis Partager → « Sur l'écran d'accueil ».
- **Android** : ouvrir dans Chrome, puis menu ⋮ → « Installer l'application ».

Les données restent sur l'appareil, sans compte. Pense à **Exporter une sauvegarde** (menu ⋯) de temps en temps. C'est aussi ce qui permet de passer d'un appareil à un autre.
