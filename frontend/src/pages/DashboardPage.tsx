import { useState, useMemo } from "react";
import { useWalletStore } from "../store/walletStore";
import { useLocks } from "../hooks/useLocks";
import { LockCard } from "../components/LockCard";
import { Modal } from "../components/Modal";
import { CreateLock } from "../components/CreateLock";
import styles from "./DashboardPage.module.scss";
import type { UILock } from "../types";
import classNames from "classnames";

const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export const DashboardPage = () => {
  const { logout, address } = useWalletStore();
  const { data: locks, isLoading } = useLocks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ongoing" | "paidback">("ongoing");

  const [showBalance, setShowBalance] = useState(true);

  const totalLockedBalance = useMemo(() => {
    if (!locks) return "0.00";
    const sum = locks.reduce((acc, lock) => {
      if (!lock.withdrawn) return acc + parseFloat(lock.amountEth);
      return acc;
    }, 0);
    return sum.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }, [locks]);

  const ongoingLocks = useMemo(
    () => locks?.filter((l) => !l.withdrawn) || [],
    [locks],
  );
  const paidBackLocks = useMemo(
    () => locks?.filter((l) => l.withdrawn) || [],
    [locks],
  );
  const displayedLocks = activeTab === "ongoing" ? ongoingLocks : paidBackLocks;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.dash}>
          <h1>SafeLock</h1>
          <span className={styles.addressBadge}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <div className={styles.actions}>
          <button onClick={logout} className={styles.logoutBtn}>
            Disconnect
          </button>
        </div>
      </header>

      {/* --- BALANCE CARD WITH EYE TOGGLE --- */}
      <section className={styles.balanceCard}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "0.5rem",
          }}
        >
          <div className={styles.balanceLabel} style={{ margin: 0 }}>
            SafeLock Balance
          </div>

          {/* THE EYE BUTTON */}
          <button
            onClick={() => setShowBalance(!showBalance)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: 0,
              opacity: 0.8,
              display: "flex",
            }}
          >
            {showBalance ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>

        <div className={styles.balanceAmount}>
          {/* Mask the main balance */}
          {showBalance ? totalLockedBalance : "****"}
          <span className={styles.currency}>ETH</span>
        </div>

        <button
          className={styles.createBtnMain}
          onClick={() => setIsModalOpen(true)}
        >
          + Create a SafeLock
        </button>
      </section>

      <div className={styles.tabsContainer}>
        <button
          className={classNames(styles.tab, {
            [styles.activeTab]: activeTab === "ongoing",
          })}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={classNames(styles.tab, {
            [styles.activeTab]: activeTab === "paidback",
          })}
          onClick={() => setActiveTab("paidback")}
        >
          Paid Back
        </button>
      </div>

      <div className={styles.grid}>
        {isLoading ? (
          <p className={styles.loadingText}>Loading your savings...</p>
        ) : displayedLocks.length === 0 ? (
          <div className={styles.emptyState}>
            {activeTab === "ongoing" ? (
              <p>No active savings. Start saving today!</p>
            ) : (
              <p>No completed savings yet.</p>
            )}
          </div>
        ) : (
          displayedLocks.map((lock: UILock) => (
            <LockCard key={lock.id} lock={lock} hideAmounts={!showBalance} />
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New SafeLock"
      >
        <CreateLock onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
