// Ce que le navigateur dit de l'installation de l'app et de la conservation de ses données.

/** Demande au navigateur de ne pas effacer les données de lui-même ; sa réponse ne change rien pour l'app. */
export function demanderStockagePersistant(): void {
  navigator.storage?.persist?.().catch(() => {});
}

/** Ouverte depuis l'écran d'accueil : en plein écran partout, `navigator.standalone` sur iPhone. */
export function estInstallee(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * `navigator.standalone` n'existe que dans le WebKit d'iOS (y compris sur iPad, qui se présente comme un Mac) :
 * s'y installer passe par le bouton Partager.
 */
export function estIOS(): boolean {
  return 'standalone' in navigator || /iPhone|iPad|iPod/.test(navigator.userAgent);
}
