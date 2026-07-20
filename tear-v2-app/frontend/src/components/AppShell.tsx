import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import styles from './AppShell.module.css';

const NAV_ITEMS: { label: string; to?: string }[] = [
  { label: 'Painel', to: '/' },
  { label: 'Marcas', to: '/marcas' },
  { label: 'Parceiras', to: '/parceiras' },
  { label: 'Campanhas', to: '/campanhas' },
  { label: 'Colaborações', to: '/colaboracoes' },
  { label: 'Briefings', to: '/briefings' },
  { label: 'Materiais', to: '/materiais' },
  { label: 'Aprovações', to: '/aprovacoes' },
  { label: 'Logística', to: '/logistica' },
  { label: 'Pagamentos', to: '/pagamentos' },
  { label: 'Documentos', to: '/documentos' },
  { label: 'Histórico', to: '/historico' },
  { label: 'Perfil', to: '/perfil' },
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
          <h1 className={styles.wordmark}>TEAR</h1>
          <p className={styles.tagline}>Gestão de Influência</p>
        </div>
        <NavList className={styles.navListVertical} />
        <button type="button" className={styles.logoutLink} onClick={onLogout}>
          sair
        </button>
      </nav>
      <div className={styles.main}>
        <header className={styles.mobileTopBar}>
          <h1 className={styles.wordmarkMobile}>TEAR</h1>
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
