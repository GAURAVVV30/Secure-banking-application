import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useBanking } from "../context/BankingContext.jsx";
import BalanceCard from "../components/BalanceCard.jsx";
import { 
  Loader2, RefreshCw, Smartphone, Tv, ShoppingBag, 
  Droplets, Landmark, Receipt, ChevronRight,
  TrendingUp, TrendingDown, Wallet, ArrowUpRight,
  Bell, Search, User, Settings, LogOut
} from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const { balance, transactions, totals, refreshAll, isLoading } = useBanking();
  const navigate = useNavigate();
  
  // UI State
  const [message, setMessage] = useState("");

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { date: "Invalid", time: "Invalid" };
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  // Form State
  const [receiverPhone, setReceiverPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditPin, setCreditPin] = useState("");

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
      refreshAll();
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
      refreshAll();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Credit failed");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const renderDirection = (tx) => {
    if (tx.type === "credit") return "CREDIT";
    if (String(tx.receiver) === String(user?.id)) return "CREDIT";
    return "DEBIT";
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto overflow-hidden">
      {/* Top Header Section - Static */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-6 shrink-0">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
            Dashboard
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium text-sm">
            Welcome back, {user?.fullName || 'User'}!
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <input 
              className="px-6 py-2.5 bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
              placeholder="Search transactions..."
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="fixed top-8 right-8 z-50 px-6 py-4 bg-indigo-600 text-white rounded-[2rem] font-bold shadow-2xl animate-in slide-in-from-top-10 duration-300">
          {message}
        </div>
      )}

      {/* Main Grid Layout - Split between scrollable sections */}
      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Section (8 Columns) - Scrollable */}
        <div className="col-span-12 xl:col-span-8 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-1">
              <BalanceCard balance={balance} user={user} />
            </div>
            
            <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-zinc-700/30 shadow-xl flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">Income</span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Received</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white">Rs. {totals.totalReceived.toLocaleString()}</h4>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-zinc-700/30 shadow-xl flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full">Spent</span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Outgoing</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white">Rs. {totals.totalOutgoing.toLocaleString()}</h4>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Wallet className="w-6 h-6 text-indigo-500" /> Quick Payments
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { id: 'mobile', icon: Smartphone, label: 'Mobile', iconColor: 'text-indigo-400' },
                { id: 'dth', icon: Tv, label: 'DTH', iconColor: 'text-purple-400' },
                { id: 'shopping', icon: ShoppingBag, label: 'Shop', iconColor: 'text-rose-400' },
                { id: 'water', icon: Droplets, label: 'Water', iconColor: 'text-cyan-400' },
                { id: 'tax', icon: Landmark, label: 'Tax', iconColor: 'text-emerald-400' },
                { id: 'loan', icon: Receipt, label: 'Loan', iconColor: 'text-amber-400' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/payments/${item.id}`)}
                  className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 rounded-3xl p-5 shadow-xl transition-all hover:shadow-indigo-500/20 hover:scale-105 active:scale-95"
                >
                  {/* Glassmorphism Overlay */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`p-4 rounded-2xl bg-white/10 mb-3 flex items-center justify-center transition-transform group-hover:rotate-6 shadow-inner`}>
                      <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                    </div>
                    <span className="font-black text-xs text-white uppercase tracking-widest">{item.label}</span>
                  </div>

                  {/* Subtle Glow */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
            {/* Transfer Form */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-zinc-800">
              <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-500" /> Send Money
              </h4>
              <form onSubmit={transfer} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="10-digit number"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount</label>
                    <input
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="₹0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure PIN</label>
                    <input
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none tracking-[0.5em]"
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      type="password"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                  Confirm Transfer
                </button>
              </form>
            </div>

            {/* Credit Form */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-zinc-800">
              <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Deposit Funds
              </h4>
              <form onSubmit={credit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount to Credit</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="₹0.00"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    type="number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account PIN</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none tracking-[0.5em]"
                    placeholder="••••"
                    value={creditPin}
                    onChange={(e) => setCreditPin(e.target.value)}
                    type="password"
                    maxLength={4}
                    required
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95">
                  Add to Balance
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Section (4 Columns) - Confined Scroll */}
        <div className="col-span-12 xl:col-span-4 h-full min-h-0 flex flex-col">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 h-full flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-zinc-800 shrink-0 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Activity</h3>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="font-bold">No activity found</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const direction = renderDirection(tx);
                  return (
                    <div key={tx._id || tx.id} className="group flex justify-between items-center p-5 bg-slate-50/50 dark:bg-zinc-800/30 rounded-3xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-zinc-700">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${direction === 'CREDIT' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                          {direction === 'CREDIT' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-white text-sm capitalize truncate">{tx.category || tx.type}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{formatDate(tx.createdAt).date}</p>
                        </div>
                      </div>
                      <div className={`font-black text-lg shrink-0 ${direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        {direction === 'CREDIT' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button 
              onClick={() => navigate("/transactions")}
              className="m-6 p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/50 rounded-2xl text-slate-600 dark:text-zinc-400 font-bold text-sm hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
            >
              View Detailed Statement <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
