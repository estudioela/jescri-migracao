import type { ReactNode } from 'react';
import type { AuthUser } from '../lib/auth';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  'Painel',
  'Marcas',
  'Parceiras',
  'Colaborações',
  'Briefings',
  'Materiais',
  'Aprovações',
  'Logística',
  'Pagamentos',
  'Documentos',
  'Histórico',
  'Perfil',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function NavList({ className }: { className: string }) {
  return (
    <ul className={className}>
      {NAV_ITEMS.map((item, index) => {
        const isActive = index === 0;
        return (
          <li key={item}>
            <span
              className={[styles.navItem, isActive && styles.navItemActive]
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={!isActive}
            >
              {item}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function AppShell({
  user,
  onLogout,
  children,
}: {
  user: AuthUser;
  onLogout: () => void;
  children: ReactNode;
}) {
  const initials = getInitials(user.name);

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
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
