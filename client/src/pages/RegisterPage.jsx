import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: ""
  });
  const [profile, setProfile] = useState({
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    accountType: "",
    pin: ""
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const onProfileChange = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedPhone = form.phone.trim();

    if (!/^[^@\s]+@gmail\.com$/i.test(trimmedEmail)) {
      setError("Email must end with @gmail.com");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    try {
      const { data } = await api.post("/auth/register", {
        ...form,
        email: trimmedEmail,
        phone: trimmedPhone
      });
      setUserId(data.userId || "");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedBankName = profile.bankName.trim();
    const trimmedBranch = profile.bankBranch.trim();
    const trimmedAccountNumber = profile.accountNumber.trim();

    if (!/^[A-Za-z\s]+$/.test(trimmedBankName)) {
      setError("Bank name must contain only letters");
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(trimmedBranch)) {
      setError("Bank branch must contain only letters");
      return;
    }

    if (!/^\d{10}$/.test(trimmedAccountNumber)) {
      setError("Account number must be exactly 10 digits");
      return;
    }

    if (!/^\d{4}$/.test(profile.pin.trim())) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (!profile.accountType) {
      setError("Please select one account type");
      return;
    }

    try {
      await api.post("/auth/complete-profile", {
        userId,
        bankName: trimmedBankName,
        bankBranch: trimmedBranch,
        accountNumber: trimmedAccountNumber,
        accountType: profile.accountType,
        pin: profile.pin.trim()
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed");
    }
  };

  return (
    <div className="card">
      <h1>Create Account</h1>
      {step === 1 ? (
        <form onSubmit={onSubmit} className="form">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            pattern="^[^@\s]+@gmail\.com$"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => onChange("password", e.target.value)}
            minLength={6}
            required
          />
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
          />
          <button type="submit">Register</button>
          <button type="button" onClick={() => navigate("/")}>Back to Login</button>
        </form>
      ) : (
        <form onSubmit={submitProfile} className="form">
          <input
            placeholder="Bank Name"
            value={profile.bankName}
            onChange={(e) => onProfileChange("bankName", e.target.value)}
            pattern="[A-Za-z\s]+"
            required
          />
          <input
            placeholder="Bank Branch"
            value={profile.bankBranch}
            onChange={(e) => onProfileChange("bankBranch", e.target.value)}
            pattern="[A-Za-z\s]+"
            required
          />
          <input
            placeholder="Account Number"
            value={profile.accountNumber}
            onChange={(e) => onProfileChange("accountNumber", e.target.value)}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
          />
          <input
            placeholder="4-digit PIN"
            value={profile.pin}
            onChange={(e) => onProfileChange("pin", e.target.value)}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            type="password"
            required
          />
          <div>
            <label>
              <input
                type="checkbox"
                checked={profile.accountType === "savings"}
                onChange={() => onProfileChange("accountType", "savings")}
              />
              Savings account
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={profile.accountType === "current"}
                onChange={() => onProfileChange("accountType", "current")}
              />
              Current account
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={profile.accountType === "fixed_deposit"}
                onChange={() => onProfileChange("accountType", "fixed_deposit")}
              />
              Fixed deposit
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={profile.accountType === "recurring_deposit"}
                onChange={() => onProfileChange("accountType", "recurring_deposit")}
              />
              Recurring deposit
            </label>
          </div>
          <button type="submit">Save Account Details</button>
        </form>
      )}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
