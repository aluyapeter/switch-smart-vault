// import { useEffect, useState } from "react";
import styles from "./LockCard.module.scss";
import classNames from "classnames";
import { useTimeStore } from "../store/timeStore";
import { WithdrawActions } from "./WithdrawActions";
import type { UILock } from "../types";

interface Props {
  lock: UILock;
}

export const LockCard = ({ lock }: Props) => {
  const now = useTimeStore((state) => state.now);

  const isUnlocked = now >= lock.unlock_timestamp;

  let statusText = "Locked";
  let statusClass = styles.locked;

  if (lock.withdrawn) {
    statusText = "Withdrawn";
    statusClass = styles.withdrawn;
  } else if (isUnlocked) {
    statusText = "Ready to Withdraw";
    statusClass = styles.ready;
  }

  const unlockDate = new Date(
    lock.unlock_timestamp * 1000,
  ).toLocaleDateString();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>{lock.goal_name}</h3>
          <span className={styles.id}>ID: #{lock.id}</span>
        </div>
      </div>

      <div className={styles.amount}>
        {lock.amountEth}
        <span>ETH</span>
      </div>

      <div className={classNames(styles.status, statusClass)}>{statusText}</div>

      {!lock.withdrawn && (
        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          Unlocks: {unlockDate}
        </div>
      )}

      <WithdrawActions lock={lock} />
    </div>
  );
};
