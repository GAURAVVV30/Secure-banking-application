import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [receiverPhone, setReceiverPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [pin, setPin] = useState("");
  const [creditPin, setCreditPin] = useState("");
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [activeView, setActiveView] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanMonths, setLoanMonths] = useState("");

  const fetchBalance = async () => {
    const { data } = await api.get("/banking/balance");
    setBalance(data.balance);
  };

  const fetchHistory = async () => {
    const { data } = await api.get("/banking/history");
    setTransactions(data.transactions || []);
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
    } catch (err) {
      setMessage(err.response?.data?.message || "Transfer failed");
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
    } catch (err) {
      setMessage(err.response?.data?.message || "Credit failed");
    }
  };

  const renderDirection = (tx) => {
    if (tx.type === "credit") return "CREDIT";
    if (String(tx.sender?._id) === String(user?.id)) return "DEBIT";
    return "CREDIT";
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
    }
  };

  return (
    <div className="card">
      <div style={{ display: "grid", justifyItems: "center", textAlign: "center", gap: "6px" }}>
        <h1>Hello</h1>
        <h2>{user?.fullName}</h2>
      </div>
      <p>Bank: {user?.bankName}</p>
      <p>Account status: {user?.statusFlag}</p>
      <div className="option-row">
        <button type="button" className="option-card" onClick={() => setActiveView("send")}>Send Money</button>
        <button type="button" className="option-card" onClick={() => setActiveView("credit")}>Credit Money</button>
        <button type="button" className="option-card" onClick={() => setActiveView("balance")}>Check Balance</button>
        <button type="button" className="option-card" onClick={() => setActiveView("history")}>View Transaction History</button>
        <button type="button" className="option-card" onClick={() => setActiveView("loan")}>Apply Loan</button>
      </div>

      {activeView === "send" ? (
        <form onSubmit={transfer} className="form">
          <h3>Send Money</h3>
          <input
            placeholder="Receiver Phone"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
          />
          <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input
            placeholder="4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            type="password"
            required
          />
          <button type="submit">Transfer Funds</button>
          <button type="button" onClick={() => setActiveView("")}>Back</button>
        </form>
      ) : null}

      {activeView === "credit" ? (
        <form onSubmit={credit} className="form">
          <h3>Credit Money</h3>
          <input
            placeholder="Amount"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />
          <input
            placeholder="4-digit PIN"
            value={creditPin}
            onChange={(e) => setCreditPin(e.target.value)}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            type="password"
            required
          />
          <button type="submit">Credit Money</button>
          <button type="button" onClick={() => setActiveView("")}>Back</button>
        </form>
      ) : null}

      {activeView === "balance" ? (
        <div className="form">
          <h3>Balance</h3>
          <h2>Rs. {balance.toLocaleString()}</h2>
          <button type="button" onClick={fetchBalance}>Refresh Balance</button>
          <button type="button" onClick={() => setActiveView("")}>Back</button>
        </div>
      ) : null}

      {activeView === "history" ? (
        <div className="list">
          <h3>Transaction History</h3>
          {transactions.map((tx) => (
            <div className="list-item" key={tx._id}>
              {renderDirection(tx)} - Rs. {Number(tx.amount).toLocaleString()} - {tx.type}
            </div>
          ))}
          <button type="button" onClick={() => setActiveView("")}>Back</button>
        </div>
      ) : null}

      {activeView === "loan" ? (
        <form onSubmit={previewLoan} className="form">
          <h3>Apply Loan</h3>
          <input
            placeholder="Loan Amount"
            value={loanAmount}
            onChange={(e) => {
              setLoanAmount(e.target.value);
              setLoanMonths("");
            }}
          />
          <select value={loanMonths} onChange={(e) => setLoanMonths(e.target.value)} required>
            <option value="">Select Months</option>
            {monthsOptions().map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
          <button type="submit">Preview Loan</button>
          <button type="button" onClick={() => setActiveView("")}>Back</button>
        </form>
      ) : null}
      {message ? <p>{message}</p> : null}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
