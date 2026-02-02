export interface ApiLock {
  id: number;
  goal_name: string;
  amount: string;
  unlock_timestamp: number;
  withdrawn: boolean;
  owner_address: string;
  tx_hash: string;
  created_at: string;
}

export interface UILock extends ApiLock {
  amountEth: string;
  status: "Locked" | "Ready" | "Withdrawn";
}
