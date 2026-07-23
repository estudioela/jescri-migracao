import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campanhaStatusTone, listCampanhas, type Campanha } from '../../lib/campanhas';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import styles from '../CampanhasListPage.module.css';

export default function PortalCampanhasListPage() {
  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCampanhas()
      .then(setCampanhas)
      .catch(() => setError('Não foi possível carregar suas campanhas. Tente novamente.'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Campanhas</h2>
          <p className={styles.subtitle}>Campanhas em que você está participando ativamente.</p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {campanhas === null && !error && <p className={styles.loading}>Carregando…</p>}

      {campanhas?.length === 0 && (
        <EmptyState
          title="Nenhuma campanha no momento"
          message="Quando você for vinculada a uma campanha ativa, ela aparecerá aqui."
        />
      )}

      {campanhas !== null && campanhas.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Campanha</th>
              <th>Marca</th>
              <th>Período</th>
              <th>Status</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {campanhas.map((campanha) => (
              <tr key={campanha.id}>
                <td>{campanha.nome}</td>
                <td>{campanha.marca.nome}</td>
                <td>
                  {campanha.data_inicio}
                  {campanha.data_fim ? ` – ${campanha.data_fim}` : ''}
                </td>
                <td>
                  <Badge label={campanha.status} tone={campanhaStatusTone(campanha.status)} />
                </td>
                <td className={styles.actionCell}>
                  {campanha.participacoes?.[0] && (
                    <Link
                      to={`/participacoes/${campanha.participacoes[0].id}`}
                      className={styles.actionLink}
                    >
                      ver
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
