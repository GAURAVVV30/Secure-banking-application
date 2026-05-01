import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

export default function AdminDashboard() {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [view, setView] = useState("home");
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
    await api.delete(`/admin/users/${userId}`);
    setSelectedUser(null);
    setHistory(null);
    await refreshUsers();
    await loadBanks();
  };

  const handleDeleteBank = async () => {
    if (!selectedBank) return;
    await api.delete(`/admin/banks/${encodeURIComponent(selectedBank)}`);
    setSelectedBank("");
    setUsers([]);
    setSelectedUser(null);
    setHistory(null);
    setView("banks");
    await loadBanks();
  };

  const header = useMemo(() => (selectedUser ? `${selectedUser.fullName} History` : "Select user"), [selectedUser]);

  const formatTime = (item) => {
    const source = item.createdAt || item.timestamp || item.updatedAt;
    if (!source) return "-";
    const date = new Date(source);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  };

  const formatDate = (item) => {
    const source = item.createdAt || item.timestamp || item.updatedAt;
    if (!source) return "-";
    const date = new Date(source);
    return date.toLocaleDateString("en-GB");
  };

  const getRowAction = (item) => item.action || item.type || "-";
  const getRowEmail = (item) => item.user?.email || item.metadata?.email || "-";
  const getRowStatus = (item) => item.status || item.metadata?.status || "-";

  const getRowClass = (item) => {
    const action = getRowAction(item);
    const status = getRowStatus(item);
    const blockedOrFlagged = Boolean(item.user?.isBlocked || item.user?.isTemporallyFlagged);

    switch (true) {
      case blockedOrFlagged:
      case status === "Pending Admin Approval":
        return "bg-red-500/20";
      case action === "login_success":
        return "bg-green-500/20";
      case action === "failed_login":
        return "bg-yellow-500/20";
      default:
        return "bg-white";
    }
  };

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
    const header = ["Status/Action", "Email", "IP Address", "Date", "Time", "Device"];
    const rows = filteredLogs.map((item) => [
      getRowAction(item),
      getRowEmail(item),
      getRowIp(item),
      formatDate(item),
      formatTime(item),
      item.deviceType || "-"
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
  };

  return (
    <div className="admin-full">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-actions">
          <button type="button" onClick={() => setView("banks")}>Manage Banks</button>
          <button type="button" onClick={() => setShowLogs((prev) => !prev)}>
            {showLogs ? "Hide Live Logs" : "Show Live Logs"}
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {showLogs ? (
        <section className="admin-panel admin-logs-screen">
          <div className="admin-panel-header">
            <h3>Live Security + User Logs</h3>
            <div className="admin-actions" style={{ justifyContent: "flex-end", width: "100%" }}>
              <input
                type="text"
                placeholder="Search by email or action"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="checkbox"
                  checked={failedOnly}
                  onChange={(e) => setFailedOnly(e.target.checked)}
                />
                Failed only
              </label>
              <button type="button" onClick={exportLogsCsv}>Export CSV</button>
              <button type="button" onClick={() => setShowLogs(false)}>
                Close Logs
              </button>
            </div>
          </div>
          <div className="admin-logs-list overflow-auto">
            <table className="w-full table-fixed border-collapse border border-gray-300 text-sm" style={{ width: "100%" }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 border border-gray-300">Status/Action</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 border border-gray-300">Email</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 border border-gray-300">Date</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 border border-gray-300">Time</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 border border-gray-300">Block User</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredLogs.map((item, idx) => {
                  const action = getRowAction(item);
                  const blockedOrFlagged = Boolean(item.user?.isBlocked || item.user?.isTemporallyFlagged);
                  const rowClass = blockedOrFlagged
                    ? "bg-red-100"
                    : action === "login_success"
                      ? "bg-green-100"
                      : action === "failed_login"
                        ? "bg-yellow-100"
                        : "bg-white";

                  return (
                    <tr key={item._id || idx} className={rowClass}>
                      <td className="px-4 py-2 text-left border border-gray-300">{getRowAction(item)}</td>
                      <td className="px-4 py-2 text-left border border-gray-300">{getRowEmail(item)}</td>
                      <td className="px-4 py-2 text-left border border-gray-300">{formatDate(item)}</td>
                      <td className="px-4 py-2 text-left border border-gray-300">{formatTime(item)}</td>
                      <td className="px-4 py-2 text-left border border-gray-300">
                        <button
                          type="button"
                          onClick={() => handleBlockFromLogs(item.user?._id)}
                          disabled={!item.user?._id}
                        >
                          Block User
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : view === "home" ? (
        <section className="admin-panel">
          <h3>Welcome to Admin Dashboard</h3>
          <p>Use Manage Banks to view and manage bank users.</p>
        </section>
      ) : view === "banks" ? (
        <section className="admin-panel">
          <h3>Select Bank</h3>
          <select value={selectedBank} onChange={(e) => selectBank(e.target.value)}>
            <option value="">Choose bank</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          <div className="admin-actions" style={{ marginTop: "12px" }}>
            <button type="button" onClick={() => selectedBank && selectBank(selectedBank)} disabled={!selectedBank}>
              Open Bank
            </button>
            <button type="button" onClick={handleDeleteBank} disabled={!selectedBank}>
              Delete Bank
            </button>
            <button type="button" onClick={() => setView("home")}>Back</button>
          </div>
        </section>
      ) : (
        <div className="admin-layout admin-layout-main">
          <section className="admin-panel">
            <div className="admin-panel-header">
              <h3>{selectedBank} Users</h3>
              <button type="button" onClick={() => setView("banks")}>Back to Manage Banks</button>
            </div>
            <div className="list">
              {users.map((u) => (
                <div key={u._id} className="list-item admin-user-row">
                  <button type="button" className="admin-user-open" onClick={() => inspectUser(u._id)}>
                    {u.fullName} - {u.statusFlag}
                  </button>
                  <div className="admin-user-actions">
                    <button type="button" onClick={() => handleBlockUser(u._id)}>Block</button>
                    <button type="button" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-panel">
            <h3>{header}</h3>
            {history ? (
              <>
                <p>Transactions: {history.transactions.length}</p>
                <p>Loans: {history.loans.length}</p>
                <p>Security Events: {history.securityEvents.length}</p>
                <div className="list">
                  {history.transactions.map((tx) => (
                    <div className="list-item" key={tx._id}>
                      {tx.type} - Rs. {Number(tx.amount).toLocaleString()}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>Select a user to view history.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
