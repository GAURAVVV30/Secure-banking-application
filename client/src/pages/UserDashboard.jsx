import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import BalanceCard from "../components/BalanceCard.jsx";
import VirtualCardManager from "../components/VirtualCardManager.jsx";
import ProfileSettings from "../components/ProfileSettings.jsx";
import Modal from "../components/Modal.jsx";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  
  // UI State
  const [activeModal, setActiveModal] = useState(null); // 'cards', 'settings', null
  const [message, setMessage] = useState("");
  
  // Form State
  const [receiverPhone, setReceiverPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditPin, setCreditPin] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanMonths, setLoanMonths] = useState("");

  const fetchBalance = async () => {
    try {
      const { data } = await api.get("/banking/balance");
      setBalance(data.balance);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/banking/history");
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

  const transfer = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/banking/transfer", {
        receiverPhone: receiverPhone.trim(),
        amount: Number(amount),
        pin: pin.trim()
      });
      setMessage(data.message);
      setAmount("");
      setPin("");
      setReceiverPhone("");
      fetchBalance();
      fetchHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Transfer failed");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const credit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/banking/credit", {
        amount: Number(creditAmount),
        pin: creditPin.trim()
      });
      setMessage(data.message);
      setCreditAmount("");
      setCreditPin("");
      fetchBalance();
      fetchHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Credit failed");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const monthsOptions = () => {
    const amountValue = Number(loanAmount);
    if (!amountValue || amountValue <= 0) return [];
    if (amountValue < 50000) return [3, 6];
    if (amountValue >= 50000 && amountValue < 2000000) return [12, 36];
    return [];
  };

  const previewLoan = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/banking/loan/preview", {
        amount: Number(loanAmount),
        months: Number(loanMonths)
      });
      navigate("/loan/confirm", { state: data });
    } catch (err) {
      setMessage(err.response?.data?.message || "Loan preview failed");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const renderDirection = (tx) => {
    if (tx.type === "credit") return "CREDIT";
    if (String(tx.sender?._id) === String(user?.id)) return "DEBIT";
    return "CREDIT";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 transition-colors duration-300 font-sans flex items-start justify-center p-6">
      <div className="flex w-full max-w-7xl mx-auto h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <Sidebar openModal={setActiveModal} onLogout={logout} />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white capitalize">
              Welcome, {user?.fullName.split(' ')[0]}
            </h2>
            {message && (
              <div className="px-5 py-2.5 bg-indigo-100/80 dark:bg-indigo-900/50 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-800 dark:text-indigo-200 rounded-2xl text-sm font-semibold shadow-lg animate-pulse">
                {message}
              </div>
            )}
          </div>

          <BalanceCard balance={balance} user={user} />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="xl:col-span-2 space-y-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transfer Card */}
                <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 rounded-3xl p-6 shadow-xl transition-all hover:shadow-2xl hover:bg-white/80 dark:hover:bg-zinc-800/80">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">Send Money</h4>
                  </div>
                  <form onSubmit={transfer} className="space-y-4">
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm"
                      placeholder="Receiver Phone (10-digit)"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      required
                    />
                    <div className="flex gap-4">
                      <input 
                        className="w-1/2 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm"
                        placeholder="Amount" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        type="number"
                        min="1"
                        required 
                      />
                      <input
                        className="w-1/2 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm tracking-widest"
                        placeholder="PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        inputMode="numeric"
                        pattern="\d{4}"
                        maxLength={4}
                        type="password"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-colors">
                      Transfer
                    </button>
                  </form>
                </div>

                {/* Credit Card */}
                <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 rounded-3xl p-6 shadow-xl transition-all hover:shadow-2xl hover:bg-white/80 dark:hover:bg-zinc-800/80">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">Credit Account</h4>
                  </div>
                  <form onSubmit={credit} className="space-y-4">
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none backdrop-blur-sm"
                      placeholder="Amount to Credit"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      type="number"
                      min="1"
                      required
                    />
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none backdrop-blur-sm tracking-widest"
                      placeholder="4-digit PIN"
                      value={creditPin}
                      onChange={(e) => setCreditPin(e.target.value)}
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      type="password"
                      required
                    />
                    <button type="submit" className="w-full py-3 bg-gray-800 hover:bg-gray-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl font-bold shadow-md transition-colors">
                      Deposit Funds
                    </button>
                  </form>
                </div>

                {/* Apply Loan */}
                <div className="md:col-span-2 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 rounded-3xl p-6 shadow-xl transition-all hover:shadow-2xl hover:bg-white/80 dark:hover:bg-zinc-800/80">
                   <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">Apply for a Loan</h4>
                  </div>
                  <form onSubmit={previewLoan} className="flex flex-col md:flex-row gap-4">
                    <input
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none backdrop-blur-sm"
                      placeholder="Loan Amount"
                      value={loanAmount}
                      onChange={(e) => {
                        setLoanAmount(e.target.value);
                        setLoanMonths("");
                      }}
                      type="number"
                      min="1000"
                      required
                    />
                    <select 
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200/50 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none backdrop-blur-sm appearance-none"
                      value={loanMonths} 
                      onChange={(e) => setLoanMonths(e.target.value)} 
                      required
                    >
                      <option value="">Repayment Period</option>
                      {monthsOptions().map((m) => (
                        <option key={m} value={m}>{m} months</option>
                      ))}
                    </select>
                    <button type="submit" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-colors whitespace-nowrap">
                      Preview Loan
                    </button>
                  </form>
                </div>

              </div>
            </div>

            {/* Recent Transactions */}
            <div className="xl:col-span-1">
              <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 rounded-3xl p-6 shadow-xl h-full flex flex-col transition-all">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
                  <button onClick={fetchHistory} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-semibold transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                    Refresh
                  </button>
                </div>
                
                {transactions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-8">
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p>No transactions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {transactions.slice(0, 8).map((tx) => {
                      const direction = renderDirection(tx);
                      return (
                        <div key={tx._id} className="flex justify-between items-center p-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm rounded-2xl hover:bg-white/80 dark:hover:bg-zinc-700/50 transition-colors border border-white/30 dark:border-zinc-700/30">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${direction === 'CREDIT' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                              {direction === 'CREDIT' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${direction === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                            {direction === 'CREDIT' ? '+' : '-'} Rs.{Number(tx.amount).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'cards'} onClose={() => setActiveModal(null)} title="Virtual Card Management">
        <VirtualCardManager />
      </Modal>

      <Modal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="Account Settings">
        <ProfileSettings />
      </Modal>
    </div>
  );
}
