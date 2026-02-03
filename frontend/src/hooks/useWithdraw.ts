import { useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "../store/walletStore";
import { useQueryClient } from "@tanstack/react-query";
import SwitchV2ABI from "../abis/SwitchV2.json";
import Deployment from "../abis/contract-address.json";

const CONTRACT_ADDRESS = Deployment.address;

export const useWithdraw = () => {
  const { signer } = useWalletStore();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const withdraw = async (lockId: number, isEmergency: boolean) => {
    if (!signer) return;

    try {
      setIsLoading(true);
      setStatus(isEmergency ? "Approving Penalty..." : "Processing...");

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SwitchV2ABI.abi,
        signer,
      );

      let tx;
      if (isEmergency) {
        tx = await contract.emergencyWithdraw(lockId);
      } else {
        tx = await contract.withdraw(lockId);
      }

      setStatus("Mining transaction...");
      await tx.wait();

      setStatus("Success! Funds sent.");

      queryClient.invalidateQueries({ queryKey: ["locks"] });

      setIsLoading(false);
      return true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const msg = error.reason || error.message || "Transaction failed";
      setStatus(`Error: ${msg}`);
      setIsLoading(false);
      return false;
    }
  };

  return { withdraw, isLoading, status };
};
