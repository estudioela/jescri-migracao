import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import styles from './AppShell.module.css';

// Itens sem `to` ficam desabilitados (span não clicável, ver NavList) em vez
// de removidos: a rota e a página continuam existindo em App.tsx — só a
// navegação pelo menu é que fica em espera até cada item ter uma visão
// própria pronta (auditoria de MVP, 2026-07-22). Briefing/Materiais/
// Pagamentos/Envio já são funcionais via drill-down a partir de
// Campanhas/Parceiras; Logística tem visão própria em /logistica desde a
// correção do backlog P0 (2026-07-22); os demais (Documentos/Histórico/
// Perfil) ainda não têm nenhuma implementação.
const NAV_ITEMS: { label: string; to?: string }[] = [
  { label: 'Painel', to: '/' },
  { label: 'Marcas', to: '/marcas' },
  { label: 'Parceiras', to: '/parceiras' },
  { label: 'Campanhas', to: '/campanhas' },
  { label: 'Colaborações (em breve)' },
  { label: 'Briefings (em breve)' },
  { label: 'Materiais (em breve)' },
  { label: 'Aprovações (em breve)' },
  { label: 'Logística', to: '/logistica' },
  { label: 'Pagamentos (em breve)' },
  { label: 'Documentos (em breve)' },
  { label: 'Histórico (em breve)' },
  { label: 'Perfil (em breve)' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function isItemActive(pathname: string, to?: string): boolean {
  if (!to) return false;
  if (to === '/') return pathname === '/';
  return pathname.startsWith(to);
}

function NavList({ className }: { className: string }) {
  const { pathname } = useLocation();

  return (
    <ul className={className}>
      {NAV_ITEMS.map((item) => {
        const isActive = isItemActive(pathname, item.to);
        const classes = [
          styles.navItem,
          item.to && styles.navItemLink,
          isActive && styles.navItemActive,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li key={item.label}>
            {item.to ? (
              <Link to={item.to} className={classes} aria-current={isActive ? 'page' : undefined}>
                {item.label}
              </Link>
            ) : (
              <span className={classes} aria-disabled="true">
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = getInitials(user.name);
  const onLogout = () => void logout();

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/elã-vermelho.svg" alt="ELÃ | influência" className={styles.wordmark} />
          <p className={styles.tagline}>Gestão de Influência</p>
        </div>
        <NavList className={styles.navListVertical} />
        <button type="button" className={styles.logoutLink} onClick={onLogout}>
          sair
        </button>
      </nav>
      <div className={styles.main}>
        <header className={styles.mobileTopBar}>
          <img src="/elã-vermelho.svg" alt="ELÃ | influência" className={styles.wordmarkMobile} />
          <div className={styles.mobileUser}>
            <span className={styles.avatar}>{initials}</span>
            <button type="button" className={styles.logoutLink} onClick={onLogout}>
              sair
            </button>
          </div>
        </header>
        <NavList className={styles.navListHorizontal} />
        <header className={styles.desktopBar}>
          <span className={styles.avatar}>{initials}</span>
          <span className={styles.userName}>{user.name}</span>
          <button type="button" className={styles.logoutLink} onClick={onLogout}>
            sair
          </button>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
