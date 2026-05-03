import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    // Settle the auth state
    setIsLoading(false);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      setSession: ({ token, user: userData }) => {
        localStorage.setItem("token", token);
        setUser(userData);
      },
      logout: () => {
        setUser(null);
      }
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
