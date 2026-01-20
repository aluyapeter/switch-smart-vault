import { useWalletStore } from "./store/walletStore";
import { CreateLock } from "./components/CreateLock";
import { LockStatus } from "./components/LockStatus";
import { Card } from "./components/Card";

function App() {
  const { address, isConnected, connectWallet } = useWalletStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-black">
      <div className="w-full max-w-md space-y-6">
        {/* Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
            SWITCH
          </h1>
          <p className="text-slate-400 mt-2">
            Decentralized Time-Locked Savings
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <div className="text-center">
              <p className="mb-6 text-slate-300">
                Connect your wallet to start saving securely on the blockchain.
              </p>
              <button
                onClick={connectWallet}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-all shadow-lg shadow-blue-500/20"
              >
                Connect MetaMask
              </button>
            </div>
          </Card>
        ) : (
          <>
            <Card title="Your Vault">
              {/* Display Address cleanly */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Connected Wallet
                </p>
                <p className="text-xs font-mono text-cyan-400 break-all bg-slate-900/50 p-2 rounded border border-slate-700">
                  {address}
                </p>
              </div>
              <LockStatus />
            </Card>

            <Card title="Create New Lock">
              <CreateLock />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
