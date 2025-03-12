import styles from "./page-load.module.css";

export default function Loading() {
  return (
    <div className={"flex-auto " + styles.overlay}>
      <div className={styles.loading}>Loading&#8230;</div>
    </div>
  );
}
