import { useState } from "react";
import { useWithdraw } from "../hooks/useWithdraw";
import { useTimeStore } from "../store/timeStore";
import styles from "./WithdrawActions.module.scss";
import type { UILock } from "../types";

interface Props {
  lock: UILock;
}

export const WithdrawActions = ({ lock }: Props) => {
  const { withdraw, isLoading, status } = useWithdraw();
  const [showWarning, setShowWarning] = useState(false);

  const now = useTimeStore((state) => state.now);

  const isUnlocked = now >= lock.unlock_timestamp;

  const handleAction = async (isEmergency: boolean) => {
    const success = await withdraw(lock.id, isEmergency);
    if (success) setShowWarning(false);
  };

  if (lock.withdrawn) return null;

  if (isLoading) {
    return (
      <p className="text-xs text-center text-slate-400 mt-4 animate-pulse">
        {status}
      </p>
    );
  }

  if (isUnlocked) {
    return (
      <div className={styles.container}>
        <button
          className={styles.standardBtn}
          onClick={() => handleAction(false)}
        >
          Claim Funds
        </button>
        {status && (
          <p className="text-xs text-red-400 mt-2 text-center">{status}</p>
        )}
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className={`${styles.container} ${styles.warningBox}`}>
        <p>
          <strong>⚠️ Take Note!</strong>
          <br />
          Unlocking early invokes a <strong>10% Penalty</strong>. You will lose
          a portion of your ETH to the treasury.
        </p>
        <button
          className={styles.confirmBtn}
          onClick={() => handleAction(true)}
        >
          I understand, Withdraw
        </button>
        <button
          className={styles.cancelBtn}
          onClick={() => setShowWarning(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.emergencyBtn}
        onClick={() => setShowWarning(true)}
      >
        Emergency Withdraw (10% Fee)
      </button>
    </div>
  );
};
