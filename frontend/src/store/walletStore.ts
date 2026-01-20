import { create } from "zustand";
import { BrowserProvider, JsonRpcSigner } from "ethers";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  provider: null,
  signer: null,

  connectWallet: async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new BrowserProvider(ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Connected:", address);

      set({
        address: address,
        isConnected: true,
        provider: provider,
        signer: signer,
      });
    } catch (error) {
      console.error("Connection failed", error);
    }
  },
}));
