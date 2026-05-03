import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBanking } from "../context/BankingContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { 
  ArrowLeft, Search, Filter, Download, 
  TrendingUp, TrendingDown, Calendar, Clock,
  ArrowRightLeft, CreditCard, ShoppingBag, Smartphone, 
  Tv, Droplets, Landmark, Receipt
} from "lucide-react";

const CATEGORY_ICONS = {
  transfer: ArrowRightLeft,
  credit: TrendingUp,
  mobile: Smartphone,
  dth: Tv,
  shopping: ShoppingBag,
  water: Droplets,
  tax: Landmark,
  loan: Receipt,
  card_payment: CreditCard
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, isLoading } = useBanking();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.category?.toLowerCase().includes(search.toLowerCase()) ||
        tx.type?.toLowerCase().includes(search.toLowerCase()) ||
        tx.amount.toString().includes(search);
      
      const direction = tx.type === "credit" || String(tx.receiver) === String(user?.id) ? "credit" : "debit";
      const matchesFilter = filter === "all" || direction === filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter, user]);

  const renderIcon = (tx) => {
    const Icon = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS[tx.type] || ArrowRightLeft;
    const direction = tx.type === "credit" || String(tx.receiver) === String(user?.id) ? "credit" : "debit";
    
    return (
      <div className={`p-3 rounded-xl ${direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} dark:bg-opacity-10`}>
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Detailed Statement</h1>
            <p className="text-slate-500 text-sm font-medium">History of all your financial activities</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2rem] shadow-xl border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Search by amount, type or category..."
          />
        </div>
        <div className="flex gap-2">
          {['all', 'credit', 'debit'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:bg-slate-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <tr className="border-b border-slate-50 dark:border-zinc-800">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
              {filteredTransactions.map((tx) => {
                const direction = tx.type === "credit" || String(tx.receiver) === String(user?.id) ? "credit" : "debit";
                const date = new Date(tx.createdAt);
                
                return (
                  <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        {renderIcon(tx)}
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white capitalize">{tx.category || tx.type}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{tx.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {date.toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={`text-lg font-black ${direction === 'credit' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        {direction === 'credit' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center">
              <Search className="w-12 h-12 text-slate-200 dark:text-zinc-800 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No transactions found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
