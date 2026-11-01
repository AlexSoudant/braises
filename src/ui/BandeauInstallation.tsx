import { useState, type RefObject } from 'react';
import { estInstallee, estIOS } from './installation';
import { lireInstallationMasquee, retenirInstallationMasquee } from './preferences';

/**
 * Tant que l'app n'est pas installée, Safari peut effacer ses données après 7 jours sans visite (ADR 0002) :
 * le bandeau explique comment l'installer. `focusEnPartant` reçoit le focus quand on le masque.
 */
export function BandeauInstallation({ focusEnPartant }: { focusEnPartant: RefObject<HTMLElement | null> }) {
  const [masque, setMasque] = useState(() => estInstallee() || lireInstallationMasquee());

  if (masque) return null;
  return (
    <section
      aria-label="Installer Braises"
      className="relative grid gap-1 rounded-xl border border-ligne bg-surface p-3 pr-12 text-sm"
    >
      <p className="font-semibold">Installe Braises sur ton écran d’accueil</p>
      <button
        type="button"
        aria-label="Masquer le conseil d’installation"
        title="Masquer"
        onClick={() => {
          retenirInstallationMasquee();
          // Le bouton disparaît avec le bandeau : le focus va sur une commande stable de l'en-tête.
          focusEnPartant.current?.focus();
          setMasque(true);
        }}
        className="absolute top-0.5 right-0.5 grid size-11 place-items-center rounded-lg text-discret"
      >
        <span aria-hidden="true">✕</span>
      </button>
      {estIOS() ? (
        <p>
          Sinon, Safari peut effacer tes données après 7 jours sans visite. Touche Partager, puis « Sur
          l’écran d’accueil ».
        </p>
      ) : (
        <p>
          Sinon, ton navigateur peut effacer tes données s’il juge le site peu utilisé. Ouvre le menu du
          navigateur, puis « Installer l’application ».
        </p>
      )}
    </section>
  );
}
