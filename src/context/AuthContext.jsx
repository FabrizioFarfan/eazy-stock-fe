import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getMyPermissions } from "../services/endpoints/permissions";

const AuthContext = createContext(null);

const REDIRECT_BY_ROLE = {
  SUPER_ADMIN: "/admin/businesses",
  OWNER: "/dashboard",
  EMPLOYEE: "/sales/new",
};

// OWNER and SUPER_ADMIN always have all permissions
const ALWAYS_ALLOWED = ["OWNER", "SUPER_ADMIN"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("eazystock_token"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadPermissions = useCallback(async () => {
    try {
      const perms = await getMyPermissions();
      setPermissions(perms);
    } catch {
      setPermissions(null);
    }
  }, []);

  // Rehydrate user on mount if a token is already stored
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(async (res) => {
        const userData = res.data.data ?? res.data;
        setUser(userData);
        await loadPermissions();
      })
      .catch(() => {
        localStorage.removeItem("eazystock_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem("eazystock_token", newToken);
    setToken(newToken);
    setUser(userData);
    await loadPermissions();

    navigate(REDIRECT_BY_ROLE[userData.role] ?? "/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("eazystock_token");
    setToken(null);
    setUser(null);
    setPermissions(null);
    navigate("/login");
  };

  /** Returns true if the current user has the given permission flag. */
  const can = useCallback(
    (permission) => {
      if (!user) return false;
      if (ALWAYS_ALLOWED.includes(user.role)) return true;
      return permissions?.[permission] === true;
    },
    [user, permissions],
  );

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, permissions, can, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
