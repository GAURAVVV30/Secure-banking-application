import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api/client.js";
import { 
  Users, Landmark, ShieldAlert, Activity, 
  Trash2, ShieldOff, Search, RefreshCw, 
  Sun, Moon, ShieldCheck, AlertTriangle, 
  Trash, X, Key, Info, History, Shield,
  ArrowRight, CheckCircle2, UserX, Loader2,
  ArrowLeft, FileText, User, Clock, Download,
  ExternalLink, CreditCard, Receipt, ShieldQuestion
} from "lucide-react";

export default function AdminDashboard() {
  // Theme State
  const [isDark, setIsDark] = useState(() => localStorage.getItem('adminTheme') === 'dark');
  
  // Data State
  const [stats, setStats] = useState({ totalUsers: 0, activeBanks: 0, flaggedUsers: 0, totalLogs: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { date: "Invalid", time: "Invalid" };
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Filtering State
  const [selectedBank, setSelectedBank] = useState(null);

  // Full Logs State
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // User Detail State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailHistory, setUserDetailHistory] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  // Modal States
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [isDeletingLogs, setIsDeletingLogs] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adminTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adminTheme', 'light');
    }
  }, [isDark]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, feedRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/security-feed")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(feedRes.data.logs);
      setSecurityEvents(feedRes.data.events);
    } catch (e) {
      console.error("Fetch failed", e);
      setMessage("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFullLogs = async () => {
    setIsLogsLoading(true);
    try {
      const { data } = await api.get("/admin/logs");
      setAllLogs(data);
    } catch (e) {
      setMessage("Failed to fetch full logs");
    } finally {
      setIsLogsLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    console.log(`[Admin] Initiating fetch for user ID: ${userId}`);
    setIsUserLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}/history`);
      console.log("[Admin] Successfully received user history packet:", data);
      setUserDetailHistory(data);
    } catch (e) {
      console.error("[Admin] History fetch failed:", e);
      setMessage("Failed to fetch user history");
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (showFullLogs) fetchFullLogs();
  }, [showFullLogs]);

  useEffect(() => {
    if (selectedUser) fetchUserDetails(selectedUser.id);
  }, [selectedUser]);

  const handleClearLogs = async (e) => {
    e.preventDefault();
    setIsDeletingLogs(true);
    try {
      await api.post("/admin/logs/clear", { pin: adminPin });
      setMessage("System audit trail wiped successfully");
      setShowClearLogsModal(false);
      setAdminPin("");
      
      // Immediate UI refresh
      fetchData();
      if (showFullLogs) fetchFullLogs();
      
      console.log("[Admin] Logs cleared. Polling for new system events...");
    } catch (err) {
      setMessage(err.response?.data?.message || "Verification failed");
      console.error("[Admin] Log wipe failed:", err);
    } finally {
      setIsDeletingLogs(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/block`);
      setMessage("User access suspended");
      fetchData();
    } catch (e) {
      setMessage("Block action failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure? This will delete all user data permanently.")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage("User account deleted");
      fetchData();
    } catch (e) {
      setMessage("Delete action failed");
    }
  };

  const handleDeleteBank = async (bankName) => {
    if (!window.confirm(`Delete bank ${bankName} and all its users?`)) return;
    try {
      await api.delete(`/admin/banks/${bankName}`);
      setMessage("Bank and associated accounts removed");
      fetchData();
    } catch (e) {
      setMessage("Bank deletion failed");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.bankName?.toLowerCase().includes(search.toLowerCase());
      
      const matchesBank = !selectedBank || u.bankName === selectedBank;
      
      return matchesSearch && matchesBank;
    });
  }, [users, search, selectedBank]);

  const filteredAllLogs = allLogs.filter(l => 
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    l.ip?.includes(search)
  );

  const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <div className={`bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${delay}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
          <h4 className="text-xl font-black text-slate-900 dark:text-white truncate">{value.toLocaleString()}</h4>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-zinc-200 transition-colors duration-500 flex flex-col overflow-hidden">
      {/* Top Navbar - Fixed */}
      <nav className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-slate-200 dark:border-zinc-800 px-8 py-4">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showFullLogs && (
              <button 
                onClick={() => setShowFullLogs(false)}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Admin Central</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Banking Control</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search globally..."
                className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-80 transition-all"
              />
            </div>
            
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
            
            <button 
              onClick={() => showFullLogs ? fetchFullLogs() : fetchData()}
              className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${(isLoading || isLogsLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-8 flex flex-col gap-8 min-h-0">
        {message && (
          <div className="fixed top-24 right-8 z-50 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right-10">
            {message}
          </div>
        )}

        {/* Analytics Grid - Static & Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-indigo-500" delay="0" />
          <StatCard icon={Landmark} label="Active Banks" value={stats.activeBanks} color="bg-emerald-500" delay="100" />
          <StatCard icon={ShieldAlert} label="Flagged Accounts" value={stats.flaggedUsers} color="bg-rose-500" delay="200" />
          <StatCard icon={Activity} label="System Logs" value={stats.totalLogs} color="bg-amber-500" delay="300" />
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
          {showFullLogs ? (
            <div className="col-span-12 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col min-h-0 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 rounded-xl text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Comprehensive Audit Trail</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete history of system interactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button 
                    onClick={() => setShowFullLogs(false)}
                    className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-lg hover:opacity-90 transition-all"
                  >
                    Close Log View
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <tr className="border-b border-slate-50 dark:border-zinc-800">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action Type</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User Email</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity / Info</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                    {isLogsLoading ? (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
                          <p className="text-slate-500 font-bold">Fetching comprehensive logs...</p>
                        </td>
                      </tr>
                    ) : filteredAllLogs.map((log) => (
                      <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                              <FileText className="w-5 h-5" />
                            </div>
                            <p className="font-bold text-slate-800 dark:text-white capitalize">{log.action?.replace(/_/g, ' ')}</p>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-zinc-400">{log.userEmail || "System"}</td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>IP: {log.ip}</span>
                            <span className="truncate max-w-[200px]">{log.deviceType}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-600 dark:text-zinc-300">{formatDate(log.createdAt).date}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(log.createdAt).time}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* Main User & Bank Management (8 Columns) - Scrollable */}
              <div className="col-span-12 xl:col-span-8 space-y-6 overflow-hidden flex flex-col min-h-0">
                {/* User Directory */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col flex-1 min-h-0">
                  <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <Users className="w-6 h-6 text-indigo-500" /> User Directory
                    </h3>
                    <div className="flex items-center gap-4">
                      {selectedBank && (
                        <button 
                          onClick={() => setSelectedBank(null)}
                          className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Clear Filter: {selectedBank}
                        </button>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-zinc-800 px-4 py-2 rounded-full">
                        {filteredUsers.length} Records found
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 dark:bg-zinc-800/50 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User Details</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Entity</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                        {filteredUsers.map((u) => (
                          <tr 
                            key={u.id} 
                            onClick={() => setSelectedUser(u)}
                            className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                          >
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-indigo-600">
                                  {u.fullName?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">{u.fullName}</p>
                                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                                {u.bankName}
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isBlocked ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {u.isBlocked ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleBlockUser(u.id)} 
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                                  title="Suspend"
                                >
                                  <UserX className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id)} 
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bank Management - Capsule Style */}
                <div className="space-y-4 shrink-0">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Managed Institutions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...new Set(users.map(u => u.bankName))].map((bank) => (
                      <button
                        key={bank}
                        onClick={() => setSelectedBank(selectedBank === bank ? null : bank)}
                        className={`px-4 py-3 rounded-2xl shadow-sm border flex items-center justify-between group transition-all text-left ${selectedBank === bank ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-indigo-500/30'}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedBank === bank ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className={`text-sm font-black truncate ${selectedBank === bank ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{bank}</h4>
                            <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${selectedBank === bank ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {users.filter(u => u.bankName === bank).length} Users
                            </p>
                          </div>
                        </div>
                        {selectedBank === bank && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side Logs & Alerts (4 Columns) - Confined Scroll */}
              <div className="col-span-12 xl:col-span-4 h-full min-h-0 flex flex-col gap-6">
                {/* Security Feed */}
                <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden shrink-0 h-1/2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6" /> Security Alerts
                  </h3>
                  <div className="h-[calc(100%-60px)] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {securityEvents.map((ev) => (
                      <div key={ev.id} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-4 shrink-0">
                        <div className="p-2 bg-rose-500 rounded-lg shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{ev.type}</p>
                          <p className="text-xs opacity-70 truncate">{ev.details}</p>
                          <p className="text-[10px] font-black uppercase mt-1 opacity-50">User ID: #{ev.userId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Audit Logs */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 flex-1 flex flex-col overflow-hidden h-1/2">
                  <div className="p-8 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <Activity className="w-6 h-6 text-amber-500" /> Audit Logs
                    </h3>
                    <button 
                      onClick={() => setShowClearLogsModal(true)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-4 p-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-zinc-700">
                        <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">{log.action}</p>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{log.ip} • {formatDate(log.createdAt).time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-slate-50 dark:border-zinc-800 shrink-0">
                    <button 
                      onClick={() => setShowFullLogs(true)}
                      className="w-full py-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold text-xs rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                    >
                      View Full Live Logs <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Modal Header */}
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
                  {selectedUser.fullName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black leading-tight">{selectedUser.fullName}</h2>
                  <p className="text-indigo-100 font-bold flex items-center gap-2 opacity-80">
                    <Mail className="w-4 h-4" /> {selectedUser.email} • ID: #{selectedUser.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
              {isUserLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                  <p className="text-slate-500 font-bold">Assembling user history...</p>
                </div>
              ) : userDetailHistory && (
                <>
                  {/* Account Overview */}
                  <section>
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
                      <ShieldCheck className="w-6 h-6 text-indigo-500" /> Account Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Banking Entity</p>
                        <p className="text-lg font-black">{userDetailHistory.user.bankName}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Account Number</p>
                        <p className="text-lg font-black text-indigo-600">{userDetailHistory.user.accountNumber || "Not Linked"}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Wallet Balance</p>
                        <p className="text-lg font-black text-emerald-500">₹{Number(userDetailHistory.user.balance).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Contact Number</p>
                        <p className="text-lg font-black">{userDetailHistory.user.phone || "N/A"}</p>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Transaction History */}
                    <section>
                      <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
                        <Receipt className="w-6 h-6 text-emerald-500" /> Recent Transactions
                      </h3>
                      <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-slate-100 dark:border-zinc-700 overflow-hidden shadow-sm">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {userDetailHistory.transactions.length > 0 ? (
                            <table className="w-full text-left">
                              <thead className="bg-slate-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
                                <tr>
                                  <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Action</th>
                                  <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-zinc-700">
                                {userDetailHistory.transactions.map((tx) => (
                                  <tr key={tx.id}>
                                    <td className="px-6 py-4">
                                      <p className="text-sm font-bold capitalize">{tx.category || tx.type}</p>
                                      <p className="text-[10px] text-slate-400">{formatDate(tx.createdAt).date}</p>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                                      {tx.type === 'credit' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-10 text-center text-slate-400 font-bold text-sm">No transaction history found</div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Access History */}
                    <section>
                      <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
                        <ShieldQuestion className="w-6 h-6 text-amber-500" /> Login & Access Logs
                      </h3>
                      <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-slate-100 dark:border-zinc-700 overflow-hidden shadow-sm">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {userDetailHistory.logs.length > 0 ? (
                            <table className="w-full text-left">
                              <thead className="bg-slate-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
                                <tr>
                                  <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Activity</th>
                                  <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right">Timestamp</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-zinc-700">
                                {userDetailHistory.logs.map((log) => (
                                  <tr key={log.id}>
                                    <td className="px-6 py-4">
                                      <p className="text-sm font-bold">{log.action}</p>
                                      <p className="text-[10px] text-slate-400">{log.ip}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <p className="text-xs font-bold text-slate-500">{formatDate(log.createdAt).date}</p>
                                      <p className="text-[10px] text-slate-400">{formatDate(log.createdAt).time}</p>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-10 text-center text-slate-400 font-bold text-sm">No access logs available</div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Modal */}
      {showClearLogsModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-black">Verify Identity</h4>
                  <p className="text-xs opacity-80 uppercase tracking-widest font-bold">Admin Clearance Required</p>
                </div>
              </div>
              <button onClick={() => setShowClearLogsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleClearLogs} className="p-8 space-y-6">
              <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/30">
                <div className="flex gap-4">
                  <AlertTriangle className="w-10 h-10 text-rose-600 shrink-0" />
                  <p className="text-sm font-medium text-rose-900 dark:text-rose-400 leading-relaxed">
                    Warning: This action will permanently erase all system logs and security history. This cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Admin Secret PIN (7-Digits)</label>
                <div className="relative">
                  <input 
                    type="password"
                    maxLength={7}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 border-none text-slate-800 dark:text-white text-2xl font-black tracking-[0.4em] focus:ring-2 focus:ring-rose-500 outline-none text-center"
                    placeholder="•••••••"
                    required
                  />
                </div>
              </div>
              
              <button 
                disabled={isDeletingLogs || adminPin.length < 7}
                className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
              >
                {isDeletingLogs ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify Secret & Clear Logs"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
