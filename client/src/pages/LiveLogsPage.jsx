import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { 
  ArrowLeft, Search, Filter, Download, 
  Activity, Clock, Mail, User, Shield,
  RefreshCw, FileText, ChevronRight, Loader2
} from "lucide-react";

export default function LiveLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/admin/logs");
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        log.ip?.includes(search);
      
      const matchesFilter = filter === "all" || log.action?.includes(filter);
      
      return matchesSearch && matchesFilter;
    });
  }, [logs, search, filter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-zinc-200 transition-colors duration-500 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <nav className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-slate-200 dark:border-zinc-800 px-8 py-4">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/admin")}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Live Audit History</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global System Events</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all active:scale-95">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={fetchLogs}
              className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-8 flex flex-col gap-8 min-h-0">
        {/* Filters Bar */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2rem] shadow-xl border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Search by email, action, or IP address..."
            />
          </div>
          <div className="flex gap-2">
            {['all', 'login', 'transfer', 'payment', 'credit'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table Container */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <tr className="border-b border-slate-50 dark:border-zinc-800">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action Type</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Network Info</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">Synchronizing audit trail...</p>
                    </td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white capitalize">{log.action?.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{log.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">{log.userEmail || "System/Unknown"}</p>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                          IP: {log.ip}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                          {log.deviceType || "Desktop"} • {log.userAgent}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && filteredLogs.length === 0 && (
              <div className="py-20 text-center">
                <Search className="w-12 h-12 text-slate-200 dark:text-zinc-800 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No audit logs found matching your search</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
