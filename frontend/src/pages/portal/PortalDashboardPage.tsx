import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getMeParceira, getMeParticipacoes, type MeParticipacao } from '../../lib/me';
import type { Parceira } from '../../lib/parceiras';
import { pagamentoStatusTone } from '../../lib/pagamentos';
import StatusBadge from '../../components/StatusBadge';
import Badge from '../../components/Badge';
import styles from '../Dashboard.module.css';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function perfilEstaCompleto(parceira: Parceira): boolean {
  return Boolean(parceira.cep && parceira.rua && parceira.cidade && parceira.uf);
}

function resumoEntregaveis(participacao: MeParticipacao): string {
  const rotulos: Record<string, string> = {
    FEED: 'feed',
    REELS: 'reels',
    STORIES: 'stories',
    TIKTOK: 'tiktok',
    UGC: 'ugc',
  };

  const partes = Object.entries(participacao.entregaveis_contratados)
    .filter(([, qtd]) => qtd > 0)
    .map(([tipo, qtd]) => `${qtd} ${rotulos[tipo]}`);

  return partes.length > 0 ? partes.join(', ') : 'sem entregáveis contratados';
}

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [parceira, setParceira] = useState<Parceira | null>(null);
  const [participacoes, setParticipacoes] = useState<MeParticipacao[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMeParceira(), getMeParticipacoes()])
      .then(([parceiraData, participacoesData]) => {
        setParceira(parceiraData);
        setParticipacoes(participacoesData);
      })
      .catch(() => setError('Não foi possível carregar os dados da sua conta.'));
  }, []);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());
  const perfilIncompleto = parceira !== null && !perfilEstaCompleto(parceira);

  return (
    <>
      <section className={styles.greeting}>
        <h2 className={styles.greetingTitle}>
          {greeting}, {firstName}.
        </h2>
        <p className={styles.greetingSubtitle}>Este é o seu painel no Portal ELÃ | influência.</p>
      </section>

      {error && <p role="alert">{error}</p>}

      {perfilIncompleto && (
        <section className={styles.cards}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Próximos passos</h3>
            <p className={styles.cardMessage}>Complete seu endereço e medidas no seu perfil.</p>
            <Link to="/perfil" className={styles.cardLink}>
              ir para o perfil
            </Link>
          </article>
        </section>
      )}

      {participacoes && participacoes.length === 0 && (
        <p className={styles.greetingSubtitle}>
          Você ainda não está em nenhuma campanha ativa. Quando a equipe te incluir em uma, ela
          aparece aqui.
        </p>
      )}

      {participacoes && participacoes.length > 0 && (
        <section className={styles.cards}>
          {participacoes.map((participacao) => (
            <Link
              key={participacao.id}
              to={`/participacoes/${participacao.id}`}
              className={styles.card}
            >
              <h3 className={styles.cardTitle}>
                {participacao.campanha.nome} — {participacao.campanha.marca.nome}
              </h3>
              <p className={styles.cardMessage}>{resumoEntregaveis(participacao)}</p>
              {participacao.pagamento_status && (
                <Badge
                  label={participacao.pagamento_status}
                  tone={pagamentoStatusTone(participacao.pagamento_status)}
                />
              )}
            </Link>
          ))}
        </section>
      )}

      {!perfilIncompleto && parceira && (
        <section className={styles.cards}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Status da conta</h3>
            <p className={styles.cardMessage}>
              <StatusBadge status={parceira.status} />
            </p>
          </article>
        </section>
      )}
    </>
  );
}
