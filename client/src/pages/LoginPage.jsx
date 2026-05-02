import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPin, setAdminPin] = useState("");
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPin, setForgotPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const isAdminEmail = email.trim().toLowerCase() === "chaos@gmail.com";

  const showFeedback = (type, text) => {
    setMessage({ type, text });
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);
    
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
        adminPin: isAdminEmail ? adminPin.trim() : undefined
      });
      setSession(data);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Login failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  const onForgotSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);
    
    try {
      const { data } = await api.post("/auth/forgot-password", {
        email,
        pin: forgotPin,
        newPassword
      });
      showFeedback("success", data.message || "Password reset successful.");
      setTimeout(() => {
        setIsForgotPassword(false);
        setPassword("");
        setForgotPin("");
        setNewPassword("");
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-zinc-700/50 p-8 sm:p-10 transition-all duration-300">
          
          <div className="text-center mb-8 relative">
            {isForgotPassword && (
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage({ type: "", text: "" });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              SecureBank
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
              {isForgotPassword ? "Reset your password" : "Welcome back! Please enter your details."}
            </p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold backdrop-blur-sm border ${
              message.type === "success" 
                ? "bg-green-50/80 border-green-100 text-green-600 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400" 
                : "bg-red-50/80 border-red-100 text-red-600 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400"
            }`}>
              {message.type === "success" ? (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {message.text}
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={onLoginSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email" 
                    className="w-full pl-4 pr-4 py-3.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 tracking-wide"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isAdminEmail && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Admin Security PIN</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="7-digit PIN"
                      inputMode="numeric"
                      pattern="\d{7}"
                      maxLength={7}
                      className="w-full pl-4 pr-4 py-3.5 bg-red-50/30 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all tracking-widest"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Authenticating...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200 dark:border-zinc-700"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-sm font-medium">OR</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-zinc-700"></div>
                </div>

                <button 
                  type="button" 
                  onClick={() => navigate("/register")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 border-2 border-blue-600 dark:border-blue-500 rounded-2xl text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Create New User
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onForgotSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email" 
                    className="w-full pl-4 pr-4 py-3.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">4-Digit Account PIN</label>
                <div className="relative">
                  <input
                    type="password"
                    value={forgotPin}
                    onChange={(e) => setForgotPin(e.target.value)}
                    placeholder="••••"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    className="w-full pl-4 pr-4 py-3.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 tracking-wide"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/30 text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
