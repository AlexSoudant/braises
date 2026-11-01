import { exporter } from '../data/db';
import { versDateJour } from '../domain/model';
import { useNotifier } from './notifier';
import { partagerOuTelecharger } from './partage';
import { retenirDernierExport } from './preferences';
import { useEnvoi } from './saisie';

/** Exporter une sauvegarde, depuis le menu comme depuis le rappel ; `echec` signale un export raté. */
export function useExportSauvegarde() {
  const { envoyer, echec } = useEnvoi();
  const notifier = useNotifier();
  const exporterSauvegarde = () =>
    envoyer(async () => {
      const maintenant = new Date();
      // Feuille de partage refermée sans choisir : rien n'est retenu.
      if (!(await partagerOuTelecharger(await exporter(maintenant)))) return;
      retenirDernierExport(versDateJour(maintenant));
      notifier({ message: 'Sauvegarde exportée' });
    });
  return { exporterSauvegarde, echec };
}
