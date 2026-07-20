import styles from './Badge.module.css';

export type BadgeTone = 'success' | 'neutral' | 'error';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: styles.success,
  neutral: styles.neutral,
  error: styles.error,
};

export default function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return <span className={[styles.badge, TONE_CLASS[tone]].join(' ')}>{label}</span>;
}
