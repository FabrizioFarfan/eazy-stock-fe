import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext(null);

const REDIRECT_BY_ROLE = {
  SUPER_ADMIN: "/admin/businesses",
  OWNER: "/dashboard",
  EMPLOYEE: "/sales/new",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("eazystock_token"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Rehydrate user on mount if a token is already stored
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data ?? res.data))
      .catch(() => {
        localStorage.removeItem("eazystock_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    // POST /api/auth/login → { token, type, user: { id, name, email, role, businessId, businessName } }
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem("eazystock_token", newToken);
    setToken(newToken);
    setUser(userData);

    navigate(REDIRECT_BY_ROLE[userData.role] ?? "/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("eazystock_token");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
