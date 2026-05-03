import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { 
  Building2, Users, ShieldAlert, Search, Download, LogOut, 
  Trash2, Ban, ArrowLeft, Activity, AlertTriangle, CheckCircle2, 
  ChevronRight, LayoutDashboard, Database
} from "lucide-react";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

export default function AdminDashboard() {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [view, setView] = useState("home"); // home, banks, users
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const { logout } = useAuth();

  const loadBanks = async () => {
    const { data } = await api.get("/admin/users");
    const uniqueBanks = Array.from(new Set(data.map((u) => u.bankName).filter(Boolean))).sort();
    setBanks(uniqueBanks);
  };

  const loadUsers = async () => {
    const { data } = await api.get(`/admin/users${selectedBank ? `?bankName=${selectedBank}` : ""}`);
    setUsers(data);
  };

  const loadSecurityFeed = async () => {
    const { data } = await api.get("/admin/security-feed");
    const combined = [...data.events, ...data.logs]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 100);
    setLiveEvents(combined);
  };

  useEffect(() => {
    loadBanks();
    loadSecurityFeed();
  }, []);

  useEffect(() => {
    if (view === "users" && selectedBank) {
      loadUsers();
    }
  }, [view, selectedBank]);

  useEffect(() => {
    const mergeLatest = (entry) => {
      setLiveEvents((prev) =>
        [entry, ...prev]
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 100)
      );
    };
    socket.on("security:event", mergeLatest);
    socket.on("user:log", mergeLatest);
    return () => {
      socket.off("security:event");
      socket.off("user:log");
    };
  }, []);

  const inspectUser = async (id) => {
    const { data } = await api.get(`/admin/users/${id}/history`);
    setSelectedUser(data.user);
    setHistory(data);
  };

  const refreshUsers = async () => {
    const { data } = await api.get(`/admin/users${selectedBank ? `?bankName=${selectedBank}` : ""}`);
    setUsers(data);
  };

  const handleBlockUser = async (userId) => {
    await api.patch(`/admin/users/${userId}/block`);
    await refreshUsers();
    if (selectedUser?._id === userId) {
      await inspectUser(userId);
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!confirm("Are you sure you want to delete this user?")) return;
    await api.delete(`/admin/users/${userId}`);
    setSelectedUser(null);
    setHistory(null);
    await refreshUsers();
    await loadBanks();
  };

  const handleDeleteBank = async () => {
    if (!selectedBank) return;
    if(!confirm(`Are you sure you want to delete all users in ${selectedBank}?`)) return;
    await api.delete(`/admin/banks/${encodeURIComponent(selectedBank)}`);
    setSelectedBank("");
    setUsers([]);
    setSelectedUser(null);
    setHistory(null);
    setView("banks");
    await loadBanks();
  };

  const formatTime = (item) => {
    if (!item) return "-";
    const source = item.createdAt || item.created_at || item.timestamp || item.updatedAt || item.updated_at;
    if (!source) return "-";
    try {
      const date = new Date(source);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    } catch (e) {
      return "-";
    }
  };

  const formatDate = (item) => {
    if (!item) return "-";
    const source = item.createdAt || item.created_at || item.timestamp || item.updatedAt || item.updated_at;
    if (!source) return "-";
    try {
      const date = new Date(source);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-GB");
    } catch (e) {
      return "-";
    }
  };



  const getRowAction = (item) => item.action || item.type || "-";
  const getRowEmail = (item) => item.user?.email || item.metadata?.email || "-";
  
  const filteredLogs = useMemo(() => {
    return liveEvents.filter((item) => {
      const action = getRowAction(item).toLowerCase();
      const email = getRowEmail(item).toLowerCase();
      const matchesSearch = searchQuery
        ? email.includes(searchQuery.toLowerCase()) || action.includes(searchQuery.toLowerCase())
        : true;
      const matchesFailed = failedOnly ? action.includes("failed") : true;
      return matchesSearch && matchesFailed;
    });
  }, [liveEvents, searchQuery, failedOnly]);

  const exportLogsCsv = () => {
    const header = ["Status/Action", "Email", "Date", "Time"];
    const rows = filteredLogs.map((item) => [
      getRowAction(item),
      getRowEmail(item),
      formatDate(item),
      formatTime(item)
    ]);

    const csvText = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBlockFromLogs = async (userId) => {
    if (!userId) return;
    await api.patch(`/admin/users/${userId}/block`);
    await loadSecurityFeed();
    if (view === "users" && selectedBank) {
      await refreshUsers();
    }
  };

  const selectBank = (bank) => {
    setSelectedBank(bank);
    setSelectedUser(null);
    setHistory(null);
    setView("users");
    setShowLogs(false);
  };

  const StatusBadge = ({ action, isBlocked }) => {
    const act = action.toLowerCase();
    if (isBlocked || act.includes("failed") || act.includes("error")) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
          <AlertTriangle className="w-3 h-3 mr-1" /> Failed / Blocked
        </span>
      );
    }
    if (act.includes("success") || act.includes("completed")) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
        <Activity className="w-3 h-3 mr-1" /> {action}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* Sticky Top Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                SOC Admin Panel
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setShowLogs(false); setView("home"); }}
                className={`flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all ${!showLogs && view === "home" ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'}`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </button>
              <button 
                onClick={() => { setShowLogs(true); setView("logs"); }}
                className={`flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all ${showLogs ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'}`}
              >
                <Activity className="w-4 h-4 mr-2" /> Live Logs
                <span className="ml-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">Live</span>
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700 mx-2"></div>
              <button 
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Live Logs View */}
        {showLogs ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700/50 overflow-hidden">
              
              <div className="p-6 border-b border-gray-200 dark:border-zinc-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-800/50 dark:to-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-indigo-500" /> Security Feed
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time monitoring of user activity and system events.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search email or action..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    />
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold cursor-pointer border border-red-100 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={failedOnly}
                      onChange={(e) => setFailedOnly(e.target.checked)}
                      className="rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    Failed Only
                  </label>
                  <button onClick={exportLogsCsv} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                    <Download className="w-4 h-4 mr-2" /> Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Status / Action</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">User Email</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No logs match your filter criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((item, idx) => {
                        const blockedOrFlagged = Boolean(item.user?.isBlocked || item.user?.isTemporallyFlagged);
                        return (
                          <tr key={item._id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge action={getRowAction(item)} isBlocked={blockedOrFlagged} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                              {getRowEmail(item)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {formatDate(item)} <span className="mx-1 text-gray-300 dark:text-zinc-600">|</span> {formatTime(item)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={() => handleBlockFromLogs(item.user?._id)}
                                disabled={!item.user?._id || blockedOrFlagged}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Ban className="w-3 h-3 mr-1" /> {blockedOrFlagged ? 'Blocked' : 'Block IP/User'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : view === "home" || view === "banks" || view === "users" ? (
          
          /* Dashboard Main View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Banks Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Manage Banks</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select a bank to view its users.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {banks.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                      No active banks found.
                    </div>
                  ) : (
                    banks.map((bank) => (
                      <button
                        key={bank}
                        onClick={() => selectBank(bank)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                          selectedBank === bank 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' 
                            : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span className="font-semibold truncate">{bank}</span>
                        <ChevronRight className={`w-5 h-5 ${selectedBank === bank ? 'text-white' : 'text-gray-400'}`} />
                      </button>
                    ))
                  )}
                </div>

                {selectedBank && (
                  <button 
                    onClick={handleDeleteBank}
                    className="w-full mt-6 flex items-center justify-center py-3 px-4 rounded-xl text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 font-bold text-sm transition-all border border-red-100 dark:border-red-900/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete '{selectedBank}'
                  </button>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {!selectedBank ? (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-center min-h-[400px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
                  <div className="relative z-10 text-center sm:text-left max-w-lg">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Welcome to the Admin Command Center</h2>
                    <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                      Select a bank from the sidebar to inspect users, review transaction histories, or manage security alerts.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex-1 min-w-[140px]">
                        <div className="text-3xl font-bold mb-1">{banks.length}</div>
                        <div className="text-blue-200 text-sm font-medium uppercase tracking-wider">Active Banks</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex-1 min-w-[140px]">
                        <div className="text-3xl font-bold mb-1">{liveEvents.length}</div>
                        <div className="text-blue-200 text-sm font-medium uppercase tracking-wider">Security Logs</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                  
                  {/* Users List */}
                  <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700/50 flex flex-col h-[600px]">
                    <div className="p-5 border-b border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 rounded-t-2xl flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" /> Users in {selectedBank}
                      </h3>
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 py-1 px-3 rounded-full text-xs font-bold">
                        {users.length} Users
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {users.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">No users found for this bank.</p>
                      ) : (
                        users.map((u) => (
                          <div 
                            key={u._id} 
                            onClick={() => inspectUser(u._id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 group ${
                              selectedUser?._id === u._id 
                                ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-500/50 shadow-md' 
                                : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md dark:bg-zinc-900/50 dark:border-zinc-700 dark:hover:border-indigo-500/50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {u.fullName}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{u.email}</p>
                              </div>
                              {u.statusFlag === "flagged" || u.isBlocked ? (
                                <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                  {u.isBlocked ? 'Blocked' : 'Flagged'}
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleBlockUser(u._id); }}
                                className="flex-1 flex justify-center items-center py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors"
                              >
                                <Ban className="w-3 h-3 mr-1.5" /> Toggle Block
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id); }}
                                className="flex-1 flex justify-center items-center py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-100 dark:border-transparent"
                              >
                                <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* User History Details */}
                  <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700/50 flex flex-col h-[600px]">
                    <div className="p-5 border-b border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 rounded-t-2xl">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white truncate">
                        <Activity className="w-5 h-5 text-purple-500" /> 
                        {selectedUser ? `${selectedUser.fullName}'s Profile` : 'User Details'}
                      </h3>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto">
                      {history && selectedUser ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                              <p className="text-[10px] uppercase font-bold text-blue-500 mb-1 tracking-wider">Balance</p>
                              <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300">Rs. {Number(selectedUser.balance || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30">
                              <p className="text-[10px] uppercase font-bold text-purple-500 mb-1 tracking-wider">Transactions</p>
                              <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300">{history.transactions.length}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 pb-2">
                              Recent Transactions
                            </h4>
                            {history.transactions.length === 0 ? (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">No transactions found.</p>
                            ) : (
                              <div className="space-y-2">
                                {history.transactions.slice(0, 10).map((tx) => (
                                  <div key={tx._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                                    <div>
                                      <p className="text-sm font-bold capitalize">{tx.type}</p>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(tx)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-extrabold">Rs. {Number(tx.amount).toLocaleString()}</p>
                                      <p className={`text-[10px] font-bold uppercase mt-0.5 ${tx.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                                        {tx.status}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-10 opacity-60">
                          <Search className="w-16 h-16 mb-4 text-gray-300 dark:text-zinc-700" />
                          <p className="text-sm font-medium">Select a user from the list<br/>to inspect their complete history.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
