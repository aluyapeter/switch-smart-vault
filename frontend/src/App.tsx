import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useWalletStore } from "./store/walletStore";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { useTimeStore } from "./store/timeStore";
import { useEffect } from "react";
import React from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { address, token } = useWalletStore();

  if (!address || !token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { startTicker, stopTicker } = useTimeStore();

  useEffect(() => {
    startTicker();
    return () => stopTicker();
  }, [startTicker, stopTicker]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
