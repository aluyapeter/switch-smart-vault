import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { useWalletStore } from "../store/walletStore";
import SwitchV2ABI from "../abis/SwitchV2.json";
import type { UILock } from "../types";
import Deployment from "../abis/contract-address.json";

const CONTRACT_ADDRESS = Deployment.address;

export const useCreateLock = () => {
  const { signer, address } = useWalletStore();
  const queryClient = useQueryClient();

  const QUERY_KEY = ["locks", address];

  return useMutation({
    mutationFn: async ({
      title,
      amount,
      timeSeconds,
    }: {
      title: string;
      amount: string;
      timeSeconds: number;
    }) => {
      if (!signer) throw new Error("No signer");

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SwitchV2ABI.abi,
        signer,
      );
      const amountWei = ethers.parseEther(amount);

      const tx = await contract.createLock(timeSeconds, title, {
        value: amountWei,
      });

      await tx.wait(1);
      return { title, amount, timeSeconds, txHash: tx.hash };
    },

    onMutate: async (newLock) => {
      if (!address) return;

      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      const previousLocks = queryClient.getQueryData<UILock[]>(QUERY_KEY);

      // Create the fake lock (before the real lock is picked up by the indexer and shown in the ui)
      const optimisticLock: UILock = {
        id: Math.random(), // Temp ID
        goal_name: newLock.title,
        amount: ethers.parseEther(newLock.amount).toString(),
        amountEth: newLock.amount,
        unlock_timestamp: Math.floor(Date.now() / 1000) + newLock.timeSeconds,
        created_at: new Date().toISOString(),
        withdrawn: false,
        owner_address: address || "",
        tx_hash: "PENDING",
        status: "Locked",
        isOptimistic: true,
      };

      queryClient.setQueryData<UILock[]>(QUERY_KEY, (old) => {
        return [optimisticLock, ...(old || [])];
      });

      return { previousLocks };
    },

    onError: (_err, _newLock, context) => {
      if (context?.previousLocks) {
        queryClient.setQueryData(QUERY_KEY, context.previousLocks);
      }
    },

    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }, 15000);
    },
  });
};
