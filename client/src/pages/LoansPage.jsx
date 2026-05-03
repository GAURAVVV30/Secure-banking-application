import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useBanking } from "../context/BankingContext.jsx";
import { 
  Banknote, Plus, History, CheckCircle2, 
  AlertCircle, ChevronRight, Info, Timer,
  ArrowRight, ShieldCheck, Wallet, Loader2
} from "lucide-react";

export default function LoansPage() {
  const navigate = useNavigate();
  const { refreshAll } = useBanking();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("apply");
  const [message, setMessage] = useState("");

  // Form State
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");

  const fetchLoans = async () => {
    try {
      const { data } = await api.get("/banking/loans");
      setLoans(data.loans || []);
    } catch (e) {
      console.error("Failed to fetch loans", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const tenureOptions = useMemo(() => {
    const amt = Number(amount);
    if (!amt || amt < 10000) return [];
    if (amt < 50000) return [10];
    if (amt < 500000) return [12, 24];
    if (amt < 5000000) return [36, 48];
    if (amt < 10000000) return [48];
    return [];
  }, [amount]);

  const emi = useMemo(() => {
    const P = Number(amount);
    const N = Number(tenure);
    if (!P || !N) return 0;
    
    const annualRate = 0.12; // 12% annual interest
    const R = annualRate / 12; // monthly rate
    
    // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
    const emiValue = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return emiValue.toFixed(2);
  }, [amount, tenure]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!emi || emi <= 0) return;
    
    try {
      const { data } = await api.post("/banking/loan/confirm", {
        amount: Number(amount),
        months: Number(tenure),
        monthlyPayment: Number(emi),
        loanType: loanType || "Personal"
      });
      setMessage("Loan approved and disbursed!");
      setAmount("");
      setTenure("");
      setLoanType("");
      setActiveTab("view");
      fetchLoans();
      refreshAll();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Application failed");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Loan Center</h1>
          <p className="text-slate-500 font-medium">Empower your dreams with flexible financing</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab("apply")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "apply" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
          >
            Apply New
          </button>
          <button 
            onClick={() => setActiveTab("view")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "view" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
          >
            My Loans
          </button>
        </div>
      </div>

      {message && (
        <div className="fixed top-8 right-8 z-50 px-8 py-4 bg-emerald-500 text-white rounded-[2rem] font-bold shadow-2xl animate-in slide-in-from-top-10">
          {message}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "apply" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            {/* Apply Form */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Plus className="w-6 h-6 text-indigo-500" /> New Application
              </h3>
              
              <form onSubmit={handleApply} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Loan Purpose</label>
                  <input 
                    required
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Home Renovation, Business Expansion"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Principal Amount (₹)</label>
                  <input 
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setTenure(""); // Reset tenure when amount changes
                    }}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-none text-slate-800 dark:text-white text-2xl font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Repayment Tenure</label>
                  {amount && Number(amount) < 10000 ? (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center gap-3 border border-rose-100 dark:border-rose-900/30">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-bold">Amounts below ₹10,000 are not eligible for loans.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {tenureOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTenure(opt)}
                          className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${tenure === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-500 hover:border-indigo-500/30'}`}
                        >
                          {opt} Months
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {emi > 0 && (
                  <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50 animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Calculated EMI</span>
                      <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">₹{Number(emi).toLocaleString()}</span>
                      <span className="text-slate-400 font-bold">/ month</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-3">Calculated at 12% APR with no hidden charges.</p>
                  </div>
                )}

                <button 
                  disabled={!emi || emi <= 0}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-2xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-3"
                >
                  Confirm & Apply <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32 blur-3xl transition-transform group-hover:scale-110"></div>
                <h4 className="text-2xl font-black mb-4 flex items-center gap-3">
                  <Timer className="w-6 h-6" /> Fast Approval
                </h4>
                <p className="text-indigo-100 font-medium mb-6 leading-relaxed">Get your funds disbursed instantly upon approval. Our automated system ensures zero paperwork and maximum speed.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Interest Rate</p>
                    <p className="text-xl font-black">12% Fixed</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Processing</p>
                    <p className="text-xl font-black">₹0 Fee</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-zinc-800">
                <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                  <Info className="w-5 h-5 text-indigo-500" /> Repayment Policy
                </h4>
                <div className="space-y-4">
                  {[
                    "Flexible tenures ranging from 10 to 48 months.",
                    "Automated EMI deductions from your bank balance.",
                    "Option to foreclose anytime with no extra charges.",
                    "Monthly updates and statements available online."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500 font-bold">Loading your loan records...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-20 rounded-[3rem] text-center border border-slate-100 dark:border-zinc-800 shadow-xl">
                <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Banknote className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">No Active Loans</h3>
                <p className="text-slate-500 font-medium mb-8">You haven't applied for any loans yet.</p>
                <button 
                  onClick={() => setActiveTab("apply")}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                >
                  Start New Application
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loans.map((loan) => (
                  <div key={loan.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-zinc-800 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${loan.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {loan.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">{loan.loanType || "Personal Loan"}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Tenure: {loan.months} Months</p>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Amount</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">₹{Number(loan.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly EMI</p>
                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{Number(loan.monthlyPayment).toLocaleString()}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate("/payments/loan")}
                      className="w-full py-4 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group"
                    >
                      Pay Installment <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
