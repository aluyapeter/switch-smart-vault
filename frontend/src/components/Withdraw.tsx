import { useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "../store/walletStore";

const CONTRACT_ADDRESS = "0x0ba8b250d6992cf426c08f1e91701eaafb808f95";

const WITHDRAW_ABI = [
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

interface WithdrawProps {
  onSuccess: () => void;
}

export const Withdraw = ({ onSuccess }: WithdrawProps) => {
  const { signer } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleWithdraw = async () => {
    if (!signer) return;

    try {
      setIsLoading(true);
      setStatus("Confirming in Wallet...");

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        WITHDRAW_ABI,
        signer,
      );

      const tx = await contract.withdraw();

      setStatus("Processing Withdrawal...");
      await tx.wait();

      setStatus("Funds Withdrawn!");
      setIsLoading(false);

      onSuccess();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const message = error.reason || error.message;
      setStatus(`Error: ${message}`);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={handleWithdraw}
        disabled={isLoading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff4d4d",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Withdrawing..." : "Withdraw Funds"}
      </button>
      {status && <p style={{ fontSize: "12px", marginTop: "5px" }}>{status}</p>}
    </div>
  );
};
