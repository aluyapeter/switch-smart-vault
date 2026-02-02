import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { formatEther } from "ethers";
import { useWalletStore } from "../store/walletStore";
import type { ApiLock, UILock } from "../types";

const fetchUserLocks = async (address: string | null): Promise<ApiLock[]> => {
  if (!address) return [];
  const { data } = await apiClient.get(`/users/${address}/locks`);
  return data;
};

export const useLocks = () => {
  const { address } = useWalletStore();

  return useQuery<ApiLock[], Error, UILock[]>({
    queryKey: ["locks", address],
    queryFn: () => fetchUserLocks(address),
    enabled: !!address,

    select: (data) =>
      data.map((lock) => {
        const now = Math.floor(Date.now() / 1000);
        const isUnlocked = now >= lock.unlock_timestamp;

        let status: UILock["status"] = "Locked";
        if (lock.withdrawn) status = "Withdrawn";
        else if (isUnlocked) status = "Ready";

        return {
          ...lock,
          amountEth: formatEther(lock.amount),
          status: status,
        };
      }),
  });
};
