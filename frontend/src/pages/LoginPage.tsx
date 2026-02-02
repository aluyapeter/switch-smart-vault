import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { useWalletStore } from "../store/walletStore";
import styles from "./LoginPage.module.scss";

export const LoginPage = () => {
  const { connectWallet, login, isConnected, isAuthenticated } =
    useWalletStore();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Switch V2</h1>
        <p className={styles.subtitle}>Decentralized Time-Locked Savings</p>

        {!isConnected ? (
          <button
            onClick={connectWallet}
            className={classNames(styles.button, styles.connect)}
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={login}
            className={classNames(styles.button, styles.login)}
          >
            Sign In With Ethereum
          </button>
        )}
      </div>
    </div>
  );
};
