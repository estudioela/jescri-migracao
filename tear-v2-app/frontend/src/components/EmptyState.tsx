import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
