import { useEffect, useState } from 'react';
import { versDateJour } from './domain/model';
import { Registre } from './ui/Registre';

export function App() {
  const aujourdhui = useAujourdhui();
  return (
    <main className="mx-auto grid max-w-3xl gap-5 px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-10">
      <header>
        <h1 className="font-titre text-4xl font-extrabold tracking-tight">Braises</h1>
        <p className="mt-1 text-discret">Garde tes amitiés au chaud.</p>
      </header>
      <Registre aujourdhui={aujourdhui} />
    </main>
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
