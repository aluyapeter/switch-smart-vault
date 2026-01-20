import { useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "../store/walletStore";

const SwitchVaultABI = [
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "uint256", name: "_timeInSeconds", type: "uint256" },
    ],
    name: "lockFunds",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const CONTRACT_ADDRESS = "0x0ba8b250d6992cf426c08f1e91701eaafb808f95";

export const CreateLock = () => {
  const { signer } = useWalletStore();

  const [amount, setAmount] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleLock = async () => {
    if (!signer) return alert("Connect wallet first!");

    try {
      setIsLoading(true);
      setStatus("Initiating Transaction...");

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SwitchVaultABI,
        signer,
      );
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.lockFunds(title, BigInt(time), {
        value: amountInWei,
      });

      setStatus("Transaction Sent! Waiting for confirmation...");
      await tx.wait();

      setStatus(`Success! Transaction Hash: ${tx.hash.slice(0, 10)}...`);
      setIsLoading(false);
      setAmount("");
      setTitle("");
      setTime("");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.reason || error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-400 ml-1">Goal Name</label>
        <input
          placeholder="e.g. Car Fund"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 ml-1">Amount (ETH)</label>
        <input
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 ml-1">
          Lock Time (Seconds)
        </label>
        <input
          placeholder="60"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        />
      </div>

      <button
        onClick={handleLock}
        disabled={isLoading}
        className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
          isLoading
            ? "bg-slate-600 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-500/20"
        }`}
      >
        {isLoading ? "Processing..." : "Lock Funds"}
      </button>

      {status && (
        <p className="text-xs text-center text-slate-400 mt-2 break-words">
          {status}
        </p>
      )}
    </div>
  );
};
