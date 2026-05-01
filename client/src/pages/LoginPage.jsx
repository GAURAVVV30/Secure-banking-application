import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [error, setError] = useState("");
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const isAdminEmail = email.trim().toLowerCase() === "chaos@gmail.com";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
        adminPin: isAdminEmail ? adminPin.trim() : undefined
      });
      setSession(data);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="card">
      <h1>Secure Banking Login</h1>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {isAdminEmail ? (
          <input
            type="password"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            placeholder="Admin 7-digit PIN"
            inputMode="numeric"
            pattern="\d{7}"
            maxLength={7}
            required
          />
        ) : null}
        <button type="submit">Login</button>
        <button type="button" onClick={() => navigate("/register")}>
          Create New User
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
