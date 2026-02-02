import { create } from "zustand";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { apiClient } from "../api/client";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isAuthenticated: boolean; // True if we have a valid JWT
  token: string | null; // The actual JWT string
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;

  connectWallet: () => Promise<void>;
  login: () => Promise<void>; // The V2 SIWE Flow
  logout: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  isConnected: false,
  isAuthenticated: false,
  token: localStorage.getItem("auth_token"), // Persist login
  provider: null,
  signer: null,

  connectWallet: async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethereum = (window as any).ethereum;
    if (!ethereum) return alert("Please install MetaMask!");

    try {
      const provider = new BrowserProvider(ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      set({ address, isConnected: true, provider, signer });
    } catch (error) {
      console.error("Connection failed", error);
    }
  },

  login: async () => {
    const { address, signer } = get();
    if (!address || !signer) return;

    try {
      const { data: nonceData } = await apiClient.post("/auth/nonce", {
        address,
      });

      const signature = await signer.signMessage(
        `Sign this nonce to login: ${nonceData.nonce}`,
      );

      const { data: authData } = await apiClient.post("/auth/verify", {
        address,
        signature,
      });

      const token = authData.access_token;
      localStorage.setItem("auth_token", token);
      set({ isAuthenticated: true, token });
    } catch (error) {
      console.error("Login failed", error);
      alert("Authentication failed.");
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({
      address: null,
      isConnected: false,
      isAuthenticated: false,
      token: null,
    });
  },
}));
