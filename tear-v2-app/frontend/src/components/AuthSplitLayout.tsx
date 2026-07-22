import type { ReactNode } from 'react';
import styles from './AuthSplitLayout.module.css';

export default function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.frame}>
      <section className={styles.brandPanel}>
        <svg
          className={styles.star}
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M60 0L63.5 45.5L108.5 28.5L74.5 60L108.5 91.5L63.5 74.5L60 120L56.5 74.5L11.5 91.5L45.5 60L11.5 28.5L56.5 45.5L60 0Z"
            fill="currentColor"
          />
        </svg>
        <span className={styles.eyebrow}>Acesso à plataforma</span>
        <img src="/elã-branco.svg" alt="ELÃ | influência" className={styles.wordmark} />
        <p className={styles.tagline}>Gestão de Influência</p>
      </section>
      <section className={styles.contentPanel}>
        <div className={styles.contentInner}>{children}</div>
      </section>
    </main>
  );
}
