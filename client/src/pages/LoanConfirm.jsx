import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client.js";

export default function LoanConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const details = location.state;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!details) {
    return (
      <div className="card">
        <h2>Loan Details Missing</h2>
        <button type="button" onClick={() => navigate("/dashboard")}>Back</button>
      </div>
    );
  }

  const confirmLoan = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/banking/loan/confirm", {
        amount: Number(details.amount),
        months: Number(details.months),
        pin: pin.trim()
      });
      setMessage(data.message);
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Loan confirmation failed");
    }
  };

  return (
    <div className="card">
      <h2>Confirm Loan</h2>
      <p>Amount: Rs. {Number(details.amount).toLocaleString()}</p>
      <p>Months: {details.months}</p>
      <p>Monthly Payment: Rs. {Number(details.monthlyPayment).toLocaleString()}</p>
      <form onSubmit={confirmLoan} className="form">
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
        <button type="submit">Confirm</button>
        <button type="button" onClick={() => navigate("/dashboard")}>Cancel</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
