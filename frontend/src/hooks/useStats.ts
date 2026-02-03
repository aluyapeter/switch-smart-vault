import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/stats");
      return data;
    },
    // Refresh stats every minute
    refetchInterval: 60000,
  });
};
