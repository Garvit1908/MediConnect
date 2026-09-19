import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.me();
      setUser(res.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshSession();
      setLoading(false);
    })();
  }, [refreshSession]);

  const login = async (payload) => {
    const res = await api.login(payload);
    setUser(res.user);
    return res.user;
  };

  const googleLogin = async ({ credential, role }) => {
    const res = await api.googleAuth({ credential, role });
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {

      document.querySelectorAll("video, audio").forEach((el) => {
        if (el.srcObject && typeof el.srcObject.getTracks === "function") {
          el.srcObject.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {
              console.warn("Error stopping media track on logout:", e);
            }
          });
          el.srcObject = null;
        }
      });
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const value = { user, setUser, loading, login, googleLogin, logout, refreshSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
