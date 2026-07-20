import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  campanhaStatusTone,
  listCampanhas,
  type Campanha,
  type CampanhaStatus,
} from '../lib/campanhas';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { LinkButton } from '../components/Button';
import styles from './CampanhasListPage.module.css';

const VALID_STATUS: CampanhaStatus[] = ['PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA'];

export default function CampanhasListPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const statusFilter = VALID_STATUS.includes(statusParam as CampanhaStatus)
    ? (statusParam as CampanhaStatus)
    : undefined;

  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCampanhas(null);
    listCampanhas(statusFilter ? { status: statusFilter } : undefined)
      .then(setCampanhas)
      .catch(() => setError('Não foi possível carregar as campanhas. Tente novamente.'));
  }, [statusFilter]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Campanhas</h2>
          <p className={styles.subtitle}>Campanhas em andamento e planejadas, por marca.</p>
        </div>
        <LinkButton to="/campanhas/nova">nova campanha</LinkButton>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {campanhas === null && !error && <p className={styles.loading}>Carregando…</p>}

      {campanhas?.length === 0 && (
        <EmptyState
          title="Nenhuma campanha cadastrada"
          message="Você ainda não possui campanhas cadastradas."
          action={<LinkButton to="/campanhas/nova">cadastrar primeira campanha</LinkButton>}
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
                  <Link to={`/campanhas/${campanha.id}`} className={styles.actionLink}>
                    ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
