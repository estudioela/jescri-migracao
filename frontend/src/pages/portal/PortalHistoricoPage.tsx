import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMeHistorico, type MeParticipacao } from '../../lib/me';
import { campanhaStatusTone } from '../../lib/campanhas';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import styles from '../CampanhasListPage.module.css';

export default function PortalHistoricoPage() {
  const [participacoes, setParticipacoes] = useState<MeParticipacao[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeHistorico()
      .then(setParticipacoes)
      .catch(() => setError('Não foi possível carregar seu histórico. Tente novamente.'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Histórico</h2>
          <p className={styles.subtitle}>Campanhas e participações encerradas ou canceladas.</p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {participacoes === null && !error && <p className={styles.loading}>Carregando…</p>}

      {participacoes?.length === 0 && (
        <EmptyState
          title="Nenhum histórico ainda"
          message="Quando uma campanha ou participação sua for encerrada, ela aparecerá aqui."
        />
      )}

      {participacoes !== null && participacoes.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Campanha</th>
              <th>Marca</th>
              <th>Período</th>
              <th>Status da campanha</th>
              <th>Pagamento</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {participacoes.map((participacao) => (
              <tr key={participacao.id}>
                <td>{participacao.campanha.nome}</td>
                <td>{participacao.campanha.marca.nome}</td>
                <td>
                  {participacao.campanha.data_inicio}
                  {participacao.campanha.data_fim ? ` – ${participacao.campanha.data_fim}` : ''}
                </td>
                <td>
                  <Badge
                    label={participacao.campanha.status}
                    tone={campanhaStatusTone(participacao.campanha.status)}
                  />
                </td>
                <td>{participacao.pagamento_status ?? '—'}</td>
                <td className={styles.actionCell}>
                  <Link to={`/participacoes/${participacao.id}`} className={styles.actionLink}>
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
