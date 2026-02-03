import { useState, useEffect } from "react";
import styles from "./LockCard.module.scss";
import classNames from "classnames";
import { WithdrawActions } from "./WithdrawActions";
import type { UILock } from "../types";

interface Props {
  lock: UILock;
  hideAmounts: boolean;
}

const formatCountdown = (targetTimestamp: number, currentTimestamp: number) => {
  const diff = targetTimestamp - currentTimestamp;
  if (diff <= 0) return "Ready";

  const days = Math.floor(diff / (3600 * 24));
  const hours = Math.floor((diff % (3600 * 24)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

export const LockCard = ({ lock, hideAmounts }: Props) => {
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isUnlocked = now >= lock.unlock_timestamp;
  const countdownText = formatCountdown(lock.unlock_timestamp, now);

  let statusText = "Locked";
  let statusClass = styles.locked;

  if (lock.withdrawn) {
    statusText = "Completed";
    statusClass = styles.withdrawn;
  } else if (isUnlocked) {
    statusText = "Ready";
    statusClass = styles.ready;
  } else if (lock.isOptimistic) {
    statusText = "Creating...";
    statusClass = styles.locked;
  }

  return (
    <div
      className={classNames(styles.card, {
        [styles.optimistic]: lock.isOptimistic,
      })}
    >
      {lock.isOptimistic && <div className={styles.pendingBadge}>PENDING</div>}

      <div className={styles.header}>
        <div>
          <h3>{lock.goal_name}</h3>
          {/* <span className={styles.id}>
            ID: #{typeof lock.id === "number" && lock.id < 1 ? "..." : lock.id}
          </span> */}
        </div>
      </div>

      <div className={styles.amount}>
        {hideAmounts ? "••••" : lock.amountEth}
        <span>ETH</span>
      </div>

      <div className={classNames(styles.status, statusClass)}>{statusText}</div>

      {!lock.withdrawn && !isUnlocked && (
        <div
          style={{
            fontSize: "0.9rem",
            color: "#fbbf24",
            fontWeight: "bold",
            marginTop: "0.5rem",
          }}
        >
          Opens in:{" "}
          <span style={{ fontFamily: "monospace" }}>{countdownText}</span>
        </div>
      )}

      {lock.withdrawn && (
        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          Unlocked on:{" "}
          {new Date(lock.unlock_timestamp * 1000).toLocaleDateString()}
        </div>
      )}

      {!lock.isOptimistic && <WithdrawActions lock={lock} />}
    </div>
  );
};
