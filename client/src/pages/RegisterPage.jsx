import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { ChevronRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
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
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const onProfileChange = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, text: "", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, text: "Weak", color: "bg-red-500", width: "w-1/3" };
    if (score === 2 || score === 3) return { score, text: "Good", color: "bg-yellow-500", width: "w-2/3" };
    return { score, text: "Strong", color: "bg-green-500", width: "w-full" };
  };

  const strength = calculateStrength(form.password);
  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;

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

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        email: trimmedEmail,
        password: form.password,
        phone: trimmedPhone
      });
      setUserId(data.userId || "");
      setStep(2);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 p-4 py-12">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-zinc-700/50 p-8 sm:p-10 transition-all duration-300">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {step === 1 ? "Create Account" : "Bank Details"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
              {step === 1 ? "Step 1 of 2: Basic Information" : "Step 2 of 2: Secure Profile Setup"}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
              <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-semibold backdrop-blur-sm">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={onSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    pattern="^[^@\s]+@gmail\.com$"
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Phone Number</label>
                <div className="relative">
                  <input
                    placeholder="10-digit number"
                    value={form.phone}
                    onChange={(e) => onChange("phone", e.target.value)}
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => onChange("password", e.target.value)}
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all tracking-wide"
                    required
                  />
                </div>
                {form.password && (
                  <div className="mt-2 ml-1">
                    <div className="flex items-center justify-between text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                      <span>Password strength</span>
                      <span className={`${strength.color.replace('bg-', 'text-')}`}>{strength.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={(e) => onChange("confirmPassword", e.target.value)}
                    minLength={6}
                    className={`w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900/50 border ${form.confirmPassword && !passwordsMatch ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/50' : 'border-gray-200 dark:border-zinc-700 focus:ring-blue-500/50'} text-gray-900 dark:text-white rounded-2xl focus:ring-2 outline-none transition-all tracking-wide`}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/30 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>
                      Continue <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full block text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitProfile} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Bank Name</label>
                  <div className="relative">
                    <input
                      placeholder="e.g. Chase"
                      value={profile.bankName}
                      onChange={(e) => onProfileChange("bankName", e.target.value)}
                      pattern="[A-Za-z\s]+"
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Branch</label>
                  <div className="relative">
                    <input
                      placeholder="e.g. Downtown"
                      value={profile.bankBranch}
                      onChange={(e) => onProfileChange("bankBranch", e.target.value)}
                      pattern="[A-Za-z\s]+"
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Account Number</label>
                <div className="relative">
                  <input
                    placeholder="10-digit number"
                    value={profile.accountNumber}
                    onChange={(e) => onProfileChange("accountNumber", e.target.value)}
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Create Security PIN</label>
                <div className="relative">
                  <input
                    placeholder="4-digit PIN"
                    value={profile.pin}
                    onChange={(e) => onProfileChange("pin", e.target.value)}
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    type="password"
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "savings", label: "Savings" },
                    { id: "current", label: "Current" },
                    { id: "fixed_deposit", label: "Fixed Deposit" },
                    { id: "recurring_deposit", label: "Recurring" }
                  ].map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                        profile.accountType === type.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={type.id}
                        checked={profile.accountType === type.id}
                        onChange={() => onProfileChange("accountType", type.id)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium mx-auto">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl shadow-lg shadow-purple-500/30 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Complete Registration"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
