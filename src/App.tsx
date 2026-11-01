import { useEffect, useRef, useState } from 'react';
import { versDateJour } from './domain/model';
import { BandeauInstallation } from './ui/BandeauInstallation';
import { FicheAmi } from './ui/FicheAmi';
import { demanderStockagePersistant } from './ui/installation';
import { Menu } from './ui/Menu';
import { ouvrirMenu, useAdresse } from './ui/navigation';
import { Notifications } from './ui/Notification';
import { NouvelAmi } from './ui/NouvelAmi';
import { Registre } from './ui/Registre';

export function App() {
  const aujourdhui = useAujourdhui();
  const adresse = useAdresse();
  const boutonMenu = useRef<HTMLButtonElement>(null);

  useEffect(demanderStockagePersistant, []);

  return (
    <Notifications>
      <main className="mx-auto grid max-w-3xl gap-5 px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-10">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-titre text-4xl font-extrabold tracking-tight">Braises</h1>
            <p className="mt-1 text-discret">Garde tes amitiés au chaud.</p>
          </div>
          <button
            ref={boutonMenu}
            type="button"
            aria-label="Menu"
            onClick={ouvrirMenu}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-ligne text-xl font-bold"
          >
            <span aria-hidden="true">⋯</span>
          </button>
        </header>
        <BandeauInstallation focusEnPartant={boutonMenu} />
        <Registre aujourdhui={aujourdhui} />
        {adresse.page === 'ami' && <FicheAmi key={adresse.id} id={adresse.id} aujourdhui={aujourdhui} />}
        {adresse.page === 'nouvelAmi' && <NouvelAmi aujourdhui={aujourdhui} />}
        {adresse.page === 'menu' && <Menu aujourdhui={aujourdhui} />}
      </main>
    </Notifications>
  );
}

/** La date du jour, recalculée quand l'app revient au premier plan (elle a pu rester ouverte jusqu'au lendemain). */
function useAujourdhui(): Date {
  const [aujourdhui, setAujourdhui] = useState(() => new Date());
  useEffect(() => {
    const rafraichir = () => {
      if (document.visibilityState !== 'visible') return;
      const maintenant = new Date();
      // Même jour : on garde la même instance pour ne pas re-rendre tout le Registre.
      setAujourdhui((avant) => (versDateJour(avant) === versDateJour(maintenant) ? avant : maintenant));
    };
    document.addEventListener('visibilitychange', rafraichir);
    return () => document.removeEventListener('visibilitychange', rafraichir);
  }, []);
  return aujourdhui;
}
