import styles from './PlaceholderPage.module.css';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.status}>Em construção — funcionalidade ainda não implementada.</p>
    </div>
  );
}
