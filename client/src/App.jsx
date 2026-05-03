import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import LoanConfirm from "./pages/LoanConfirm.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import LoansPage from "./pages/LoansPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { BankingProvider } from "./context/BankingContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";

function PrivateRoute({ children, role }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="mt-6 text-xl font-bold text-gray-800 dark:text-gray-100 animate-pulse">SecureBank</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Securing your session...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Dashboard Routes with Persistent Layout */}
        <Route
          element={
            <PrivateRoute role="user">
              <BankingProvider>
                <DashboardLayout />
              </BankingProvider>
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/loan/confirm" element={<LoanConfirm />} />
          <Route path="/payments/:type" element={<PaymentPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}
