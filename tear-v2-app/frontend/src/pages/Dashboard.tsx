import { useAuth } from '../lib/auth';
import type { Role } from '../lib/auth';
import styles from './Dashboard.module.css';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador(a)',
  GESTOR_MARCA: 'Gestor(a) de Marca',
  INFLUENCIADORA: 'Influenciadora',
};

const EMPTY_STATE_CARDS = [
  {
    title: 'Colaborações',
    message: 'Você ainda não possui colaborações cadastradas.',
  },
  {
    title: 'Aprovações',
    message: 'Nenhuma aprovação pendente.',
  },
  {
    title: 'Financeiro',
    message: 'Nenhum pagamento registrado.',
  },
];

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());
  const roleLabel = user.role ? ROLE_LABELS[user.role] : 'Sem papel atribuído';

  return (
    <>
      <section className={styles.greeting}>
        <h2 className={styles.greetingTitle}>
          {greeting}, {firstName}.
        </h2>
        <p className={styles.greetingSubtitle}>{roleLabel} — este é o seu painel TEAR.</p>
      </section>
      <section className={styles.cards}>
        {EMPTY_STATE_CARDS.map((card) => (
          <article key={card.title} className={styles.card}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardMessage}>{card.message}</p>
          </article>
        ))}
      </section>
    </>
  );
}
