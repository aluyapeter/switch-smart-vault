import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { useWalletStore } from "../store/walletStore";
import { useStats } from "../hooks/useStats";
import styles from "./LoginPage.module.scss";

export const LoginPage = () => {
  const { connectWallet, login, isConnected, isAuthenticated } =
    useWalletStore();
  const navigate = useNavigate();
  const { data: stats } = useStats();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.logo}>SWITCH V2</div>
        <div className="text-sm text-slate-400">Sepolia Testnet</div>
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <h1>
          Lock. Save.
          <br />
          <span style={{ color: "#fff" }}>Earn Trust.</span>
        </h1>
        <p>
          The decentralized time-locked savings protocol. Commit your ETH to a
          future date. Withdraw early only if you pay the price.
        </p>

        {/* Connect/Login Buttons */}
        <div className={styles.actionArea}>
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className={classNames(styles.button, styles.connect)}
              style={{
                background: "#3b82f6",
                padding: "1rem",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={login}
              className={classNames(styles.button, styles.login)}
              style={{
                background: "#10b981",
                padding: "1rem",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Sign In to Dashboard
            </button>
          )}
        </div>

        {/* Live Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>{stats?.tvl_eth.toFixed(2) || "0.00"}</h3>
            <span>ETH Locked</span>
          </div>
          <div className={styles.statCard}>
            <h3>{stats?.total_locks || "0"}</h3>
            <span>Active Goals</span>
          </div>
          <div className={styles.statCard}>
            <h3>{stats?.total_users || "0"}</h3>
            <span>Savers</span>
          </div>
        </div>
      </div>
    </div>
  );
};
