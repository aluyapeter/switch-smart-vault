import React from "react";
import styles from "./Card.module.scss";

export const Card = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => {
  return (
    <div className={styles.card}>
      <div className={`${styles.glow} ${styles.purple}`}></div>
      <div className={`${styles.glow} ${styles.blue}`}></div>

      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.content}>{children}</div>
    </div>
  );
};
