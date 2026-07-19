import type { ParceiraStatus } from '../lib/parceiras';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }: { status: ParceiraStatus }) {
  const isActive = status === 'Ativa';

  return (
    <span className={[styles.badge, isActive ? styles.active : styles.inactive].join(' ')}>
      {status}
    </span>
  );
}
