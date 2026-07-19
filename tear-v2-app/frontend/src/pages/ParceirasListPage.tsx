import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listParceiras, type Parceira } from '../lib/parceiras';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { LinkButton } from '../components/Button';
import styles from './ParceirasListPage.module.css';

export default function ParceirasListPage() {
  const [parceiras, setParceiras] = useState<Parceira[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listParceiras()
      .then(setParceiras)
      .catch(() => setError('Não foi possível carregar as parceiras. Tente novamente.'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Parceiras</h2>
          <p className={styles.subtitle}>Base de influenciadoras cadastradas.</p>
        </div>
        <LinkButton to="/parceiras/nova">nova parceira</LinkButton>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {parceiras === null && !error && <p className={styles.loading}>Carregando…</p>}

      {parceiras?.length === 0 && (
        <EmptyState
          title="Nenhuma parceira cadastrada"
          message="Você ainda não possui parceiras cadastradas."
          action={<LinkButton to="/parceiras/nova">cadastrar primeira parceira</LinkButton>}
        />
      )}

      {parceiras !== null && parceiras.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Email</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {parceiras.map((parceira) => (
              <tr key={parceira.id}>
                <td>{parceira.nome}</td>
                <td>
                  <StatusBadge status={parceira.status} />
                </td>
                <td>{parceira.email ?? '—'}</td>
                <td className={styles.actionCell}>
                  <Link to={`/parceiras/${parceira.id}`} className={styles.actionLink}>
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
