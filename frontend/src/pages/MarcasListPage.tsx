import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMarcasPage, type Marca } from '../lib/marcas';
import { useAuth } from '../lib/auth';
import EmptyState from '../components/EmptyState';
import { LinkButton } from '../components/Button';
import styles from './MarcasListPage.module.css';

export default function MarcasListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [marcas, setMarcas] = useState<Marca[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    setMarcas(null);
    listMarcasPage({ page })
      .then((response) => {
        setMarcas(response.data);
        setLastPage(response.meta?.last_page ?? 1);
      })
      .catch(() => setError('Não foi possível carregar as marcas. Tente novamente.'));
  }, [page]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Marcas</h2>
          <p className={styles.subtitle}>Clientes para quem a equipe roda campanhas.</p>
        </div>
        {isAdmin && <LinkButton to="/marcas/nova">nova marca</LinkButton>}
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {marcas === null && !error && <p className={styles.loading}>Carregando…</p>}

      {marcas?.length === 0 && (
        <EmptyState
          title="Nenhuma marca cadastrada"
          message="Você ainda não possui marcas cadastradas."
          action={isAdmin ? <LinkButton to="/marcas/nova">cadastrar primeira marca</LinkButton> : undefined}
        />
      )}

      {marcas !== null && marcas.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Contato</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {marcas.map((marca) => (
              <tr key={marca.id}>
                <td>{marca.nome}</td>
                <td>{marca.status}</td>
                <td>{marca.contato_email ?? '—'}</td>
                <td className={styles.actionCell}>
                  {isAdmin && (
                    <Link to={`/marcas/${marca.id}/editar`} className={styles.actionLink}>
                      editar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {marcas !== null && marcas.length > 0 && lastPage > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            página {page} de {lastPage}
          </span>
          <button
            type="button"
            className={styles.paginationButton}
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            anterior
          </button>
          <button
            type="button"
            className={styles.paginationButton}
            disabled={page >= lastPage}
            onClick={() => setPage((current) => current + 1)}
          >
            próxima
          </button>
        </div>
      )}
    </div>
  );
}
