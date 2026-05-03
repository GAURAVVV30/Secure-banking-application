import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function BalanceCard({ balance, user }) {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden transition-colors duration-300 w-full">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl mix-blend-overlay"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-20 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl mix-blend-overlay"></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-indigo-100 font-medium opacity-90 text-sm uppercase tracking-wider">Available Balance</p>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              {showBalance ? `Rs. ${(balance ?? 0).toLocaleString()}` : "Rs. ••••••"}
            </h1>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10 shadow-sm">
            {user?.statusFlag === 'active' ? 'Active' : 'Restricted'}
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <p className="text-indigo-200 font-medium mb-1 opacity-80 text-xs uppercase tracking-widest">Account Holder</p>
            <p className="text-xl font-semibold tracking-wide">{user?.fullName || 'User'}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 font-medium mb-1 opacity-80 text-xs uppercase tracking-widest">Bank</p>
            <p className="text-md font-semibold tracking-wide">{user?.bankName || 'SecureBank'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
