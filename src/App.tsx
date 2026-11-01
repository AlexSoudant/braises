import { Registre } from './ui/Registre';

export function App() {
  const aujourdhui = new Date();
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
