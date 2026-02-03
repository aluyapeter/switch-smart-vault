import { useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "../store/walletStore";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./CreateLock.module.scss";
import SwitchV2ABI from "../abis/SwitchV2.json";
import Deployment from "../abis/contract-address.json";

const CONTRACT_ADDRESS = Deployment.address;

interface Props {
  onSuccess: () => void;
}

export const CreateLock = ({ onSuccess }: Props) => {
  const { signer } = useWalletStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) return;

    try {
      setIsLoading(true);
      setStatus("Preparing Transaction...");

      const amountWei = ethers.parseEther(amount);
      const timeSeconds = parseInt(days) * 24 * 60 * 60;

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SwitchV2ABI.abi,
        signer,
      );

      setStatus("Sign in Wallet...");
      const tx = await contract.createLock(timeSeconds, title, {
        value: amountWei,
      });

      setStatus("Mining...");
      await tx.wait();

      setStatus("Success!");
      queryClient.invalidateQueries({ queryKey: ["locks"] });

      setIsLoading(false);
      onSuccess();
    } catch (err: unknown) {
      console.error(err);

      let errorMessage = "Transaction failed";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      if (typeof err === "object" && err !== null) {
        const ethersError = err as { reason?: string; shortMessage?: string };
        if (ethersError.reason) errorMessage = ethersError.reason;
        else if (ethersError.shortMessage)
          errorMessage = ethersError.shortMessage;
      }

      setStatus(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleCreate}>
      <div className={styles.inputGroup}>
        <label>Goal Name</label>
        <input
          placeholder="e.g. Lambo Fund"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Amount (ETH)</label>
        <input
          type="number"
          step="0.0001"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Duration (Days)</label>
        <input
          type="number"
          placeholder="30"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={isLoading} className={styles.submitBtn}>
        {isLoading ? status : "Create Lock 🔒"}
      </button>

      {status && !isLoading && (
        <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>{status}</p>
      )}
    </form>
  );
};
