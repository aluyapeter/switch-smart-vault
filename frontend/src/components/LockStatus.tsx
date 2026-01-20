import { useEffect, useState, useCallback } from "react";
import { useWalletStore } from "../store/walletStore";
import { ethers } from "ethers";
import { Withdraw } from "./Withdraw";

const READ_ABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "locks",
    outputs: [
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "unlockTime", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const CONTRACT_ADDRESS = "0x0ba8b250d6992cf426c08f1e91701eaafb808f95";

export const LockStatus = () => {
  const { address, signer } = useWalletStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lockData, setLockData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  const fetchLock = useCallback(async () => {
    if (!signer || !address) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, READ_ABI, signer);
      const data = await contract.locks(address);

      if (data[1] === BigInt(0)) {
        setLockData(null);
        return;
      }

      setLockData({
        title: data[0],
        amount: ethers.formatEther(data[1]),
        unlockTime: Number(data[2]),
      });
    } catch (err) {
      console.error("Error fetching lock:", err);
    }
  }, [signer, address]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchLock();
    const interval = setInterval(fetchLock, 10000);
    return () => clearInterval(interval);
  }, [fetchLock]);

  useEffect(() => {
    if (!lockData) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = lockData.unlockTime - now;

      if (secondsRemaining <= 0) {
        setTimeLeft("Ready to Withdraw!");
        setIsReady(true);
      } else {
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        setTimeLeft(`${mins}m ${secs}s`);
        setIsReady(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockData]);

  if (!lockData) return null;

  return (
    <div className="mt-6 p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/30">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-emerald-400 text-xs uppercase tracking-wider font-bold">
            Active Savings
          </p>
          <h3 className="text-white text-lg font-bold">{lockData.title}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {lockData.amount}{" "}
            <span className="text-sm text-emerald-400">ETH</span>
          </p>
        </div>
      </div>

      <div className="bg-emerald-950/50 rounded-lg p-3 mt-2 flex justify-between items-center border border-emerald-900/50">
        <span className="text-emerald-400 text-sm">Status:</span>
        <span
          className={`font-mono font-bold ${isReady ? "text-white animate-pulse" : "text-emerald-300"}`}
        >
          {timeLeft}
        </span>
      </div>

      {isReady && (
        <div className="mt-4">
          <Withdraw onSuccess={fetchLock} />
        </div>
      )}
    </div>
  );
};
