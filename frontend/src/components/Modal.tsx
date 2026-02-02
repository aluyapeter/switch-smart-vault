import React from "react";
import styles from "./Modal.module.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal = ({ isOpen, onClose, children, title }: Props) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* stopPropagation prevents clicking inside the box from closing it */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>
        {title && <h2 style={{ marginBottom: "1.5rem" }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
};
