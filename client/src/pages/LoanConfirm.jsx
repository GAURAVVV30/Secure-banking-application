import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client.js";
import { 
  BadgeIndianRupee, CalendarClock, Calculator, 
  ShieldCheck, AlertTriangle, ArrowLeft, Loader2 
} from "lucide-react";

export default function LoanConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const details = location.state;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!details) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-900 p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-zinc-700">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Details Missing</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">We couldn't find the loan application details. Please start the process again.</p>
          <button 
            type="button" 
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-full py-3 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-800 dark:text-white rounded-xl font-bold transition-all"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const confirmLoan = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const { data } = await api.post("/banking/loan/confirm", {
        amount: Number(details.amount),
        months: Number(details.months),
        pin: pin.trim()
      });
      setMessage(data.message || "Loan confirmed successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Loan confirmation failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-900 p-4 font-sans relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2"></div>
      
      <div className="relative w-full max-w-md bg-white/80 dark:bg-zinc-800/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-zinc-700/50 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center text-white relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold tracking-tight mb-1">Review Loan</h2>
            <p className="text-purple-100 text-sm font-medium opacity-90">Please verify the details before confirming.</p>
          </div>
        </div>

        <div className="p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-semibold animate-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50/80 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-sm font-semibold animate-in slide-in-from-top-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {message}
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              {/* Amount Card */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-700/50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-2">
                  <BadgeIndianRupee className="w-4 h-4 text-indigo-500" />
                  <span className="text-[11px] uppercase tracking-wider font-bold">Principal</span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  Rs. {Number(details.amount).toLocaleString()}
                </p>
              </div>

              {/* Term Card */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-700/50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-2">
                  <CalendarClock className="w-4 h-4 text-indigo-500" />
                  <span className="text-[11px] uppercase tracking-wider font-bold">Term</span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {details.months} <span className="text-sm font-medium text-slate-500">months</span>
                </p>
              </div>
            </div>

            {/* EMI Card (Highlighted) */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1 relative z-10">
                <Calculator className="w-5 h-5" />
                <span className="text-[11px] uppercase tracking-widest font-extrabold">Monthly EMI</span>
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                <p className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-300">
                  Rs. {Number(details.monthlyPayment).toLocaleString()}
                </p>
                <span className="text-sm font-semibold text-indigo-600/70 dark:text-indigo-400/70">/mo</span>
              </div>
            </div>
          </div>

          <form onSubmit={confirmLoan} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" /> Authorize with PIN
              </label>
              <input
                className="w-full px-5 py-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all tracking-[1em] text-center text-xl font-bold placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-base shadow-inner disabled:opacity-50"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                type="password"
                required
                disabled={isLoading || message !== ""}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => navigate("/dashboard")}
                disabled={isLoading || message !== ""}
                className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 text-slate-700 dark:text-gray-300 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 border border-slate-200 dark:border-zinc-700/50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading || message !== ""}
                className="flex-[2] flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border border-transparent"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : message ? (
                  "Confirmed!"
                ) : (
                  "Confirm & Accept"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
