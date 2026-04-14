import { useState, useCallback, type ReactNode } from "react";
import api from "../services/api";
import { AuthContext, type User } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("pixelwar-user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("pixelwar-token")
  );
  const [loading, setLoading] = useState(false);

  const login = useCallback((user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("pixelwar-user", JSON.stringify(user));
    localStorage.setItem("pixelwar-token", token);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { credential });
      // Le backend doit renvoyer { user: User, token: string }
      login(data.user, data.token);
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pixelwar-user");
    localStorage.removeItem("pixelwar-token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

