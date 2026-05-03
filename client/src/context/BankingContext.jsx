import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const BankingContext = createContext(null);

export const BankingProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ totalReceived: 0, totalOutgoing: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/banking/balance");
      setBalance(data.balance ?? 0);
    } catch (e) {
      console.error("Failed to fetch balance", e);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/banking/history");
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  }, [user]);

  const fetchTotals = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/banking/totals");
      setTotals({
        totalReceived: data.totalReceived || 0,
        totalOutgoing: data.totalOutgoing || 0
      });
    } catch (e) {
      console.error("Failed to fetch totals", e);
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchBalance(), fetchHistory(), fetchTotals()]);
    setIsLoading(false);
  }, [fetchBalance, fetchHistory, fetchTotals]);

  useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      setBalance(0);
      setTransactions([]);
      setTotals({ totalReceived: 0, totalOutgoing: 0 });
    }
  }, [user, refreshAll]);

  const value = {
    balance,
    transactions,
    totals,
    isLoading,
    refreshBalance: fetchBalance,
    refreshHistory: fetchHistory,
    refreshTotals: fetchTotals,
    refreshAll
  };

  return <BankingContext.Provider value={value}>{children}</BankingContext.Provider>;
};

export const useBanking = () => {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error("useBanking must be used within a BankingProvider");
  }
  return context;
};
