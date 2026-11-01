/**
 * Remet un fichier à l'utilisateur : feuille de partage native quand elle accepte les fichiers (téléphone),
 * sinon téléchargement. Renvoie `false` si l'utilisateur a refermé la feuille de partage sans choisir.
 * Si le navigateur refuse le partage (Safari, quand le geste de l'utilisateur est jugé trop ancien),
 * le fichier est téléchargé à la place.
 */
export async function partagerOuTelecharger(fichier: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: fichier.name });
      return true;
    } catch (e) {
      // Refermer la feuille de partage n'est pas une erreur.
      if (e instanceof DOMException && e.name === 'AbortError') return false;
      if (!(e instanceof DOMException && e.name === 'NotAllowedError')) throw e;
    }
  }
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = fichier.name;
  document.body.append(lien);
  lien.click();
  lien.remove();
  // Laisse au navigateur, même lent, le temps de lancer le téléchargement avant de libérer le fichier.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
