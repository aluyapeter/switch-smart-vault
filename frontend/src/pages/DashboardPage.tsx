import { useState } from "react";
import { useWalletStore } from "../store/walletStore";
import { useLocks } from "../hooks/useLocks";
import { LockCard } from "../components/LockCard";
import { Modal } from "../components/Modal";
import { CreateLock } from "../components/CreateLock";
import styles from "./DashboardPage.module.scss";
import type { UILock } from "../types";

export const DashboardPage = () => {
  const { logout, address } = useWalletStore();
  const { data: locks, isLoading } = useLocks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.dash}>
          <h1>Dashboard</h1>
          <span className={styles.addressBadge}>{address}</span>
        </div>

        <div className={styles.debug} style={{ display: "flex", gap: "1rem" }}>
          <button
            className={styles.createBtn}
            onClick={() => setIsModalOpen(true)}
          >
            + New Lock
          </button>

          <button onClick={logout} className={styles.logoutBtn}>
            Disconnect
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {isLoading ? (
          <p>Loading...</p>
        ) : locks?.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No savings found. Create your first lock!</p>
          </div>
        ) : (
          locks?.map((lock: UILock) => <LockCard key={lock.id} lock={lock} />)
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Savings Goal"
      >
        <CreateLock onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
