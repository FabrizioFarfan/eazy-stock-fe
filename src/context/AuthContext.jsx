import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getMyPermissions } from "../services/endpoints/permissions";
import { tutorialsApi } from "../services/endpoints/tutorials";

const AuthContext = createContext(null);

const REDIRECT_BY_ROLE = {
  BOSS: "/boss",
  SUPER_ADMIN: "/admin/businesses",
  OWNER: "/dashboard",
  EMPLOYEE: "/sales/new",
};

const ALWAYS_ALLOWED = ["OWNER", "SUPER_ADMIN"];

// BOSS es superset de SUPER_ADMIN: normalizamos el role para que toda la app
// existente lo trate como admin, y marcamos isBoss para las vistas exclusivas.
const normalizeUser = (u) =>
  u && u.role === "BOSS" ? { ...u, role: "SUPER_ADMIN", isBoss: true } : u;

// Flags de tutoriales que antes vivían solo en localStorage. Se migran al BE
// una vez para que los usuarios existentes no vuelvan a ver todo tras el cambio.
function collectLegacyTutorialFlags(user) {
  const found = [];
  try {
    const uid = user?.id ?? user?.email;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("eazystock_")) continue;
      if (k.includes("_help_v")) found.push(k);
      else if (uid && k === `eazystock_tutorial_seen_${uid}`) found.push("eazystock_tutorial_seen");
      else if (uid && k === `eazystock_product_tutorial_seen_v3_${uid}`) found.push("eazystock_product_tutorial_seen_v3");
    }
  } catch { /* localStorage bloqueado */ }
  return found;
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [token, setToken]             = useState(() => localStorage.getItem("eazystock_token"));
  const [isLoading, setIsLoading]     = useState(true);
  // null = aún no cargado del BE; Set<string> = claves de tutoriales ya vistos
  const [seenTutorials, setSeenTutorials] = useState(null);
  const navigate = useNavigate();

  const loadPermissions = useCallback(async () => {
    try {
      const perms = await getMyPermissions();
      setPermissions(perms);
    } catch {
      setPermissions(null);
    }
  }, []);

  // Carga los tutoriales vistos del BE y sincroniza los flags legacy de localStorage
  const loadTutorials = useCallback(async (userData) => {
    try {
      const res = await tutorialsApi.getSeen();
      const remote = new Set(res.data.data ?? res.data ?? []);
      const legacy = collectLegacyTutorialFlags(userData).filter((k) => !remote.has(k));
      if (legacy.length > 0) {
        legacy.forEach((k) => remote.add(k));
        tutorialsApi.markSeen(legacy).catch(() => {});
      }
      setSeenTutorials(remote);
    } catch {
      // BE inaccesible: no auto-abrir nada (mejor no repetir tutoriales por error)
      setSeenTutorials(null);
    }
  }, []);

  // Marca un tutorial como visto: optimista en memoria + persistencia en BE
  const markTutorialSeen = useCallback((key) => {
    if (!key) return;
    setSeenTutorials((prev) => {
      if (prev?.has(key)) return prev;
      const next = new Set(prev ?? []);
      next.add(key);
      return next;
    });
    tutorialsApi.markSeen([key]).catch(() => {});
  }, []);

  // Rehydrate user on mount — the axios interceptor will silently refresh if needed
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(async (res) => {
        const userData = res.data.data ?? res.data;
        setUser(normalizeUser(userData));
        // Sync access token in case the interceptor refreshed it during /me
        const currentToken = localStorage.getItem("eazystock_token");
        if (currentToken !== token) setToken(currentToken);
        await Promise.all([loadPermissions(), loadTutorials(userData)]);
      })
      .catch(() => {
        localStorage.removeItem("eazystock_token");
        localStorage.removeItem("eazystock_refresh_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, refreshToken, user: userData } = res.data;

    localStorage.setItem("eazystock_token", accessToken);
    localStorage.setItem("eazystock_refresh_token", refreshToken);
    setToken(accessToken);
    setUser(normalizeUser(userData));
    await Promise.all([loadPermissions(), loadTutorials(userData)]);

    navigate(REDIRECT_BY_ROLE[userData.role] ?? "/dashboard");
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("eazystock_refresh_token");
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch { /* ignore — clear locally regardless */ }
    _clearSession();
  };

  const logoutAll = async () => {
    try {
      await api.post("/auth/logout-all");
    } catch { /* ignore */ }
    _clearSession();
  };

  const _clearSession = () => {
    localStorage.removeItem("eazystock_token");
    localStorage.removeItem("eazystock_refresh_token");
    setToken(null);
    setUser(null);
    setPermissions(null);
    setSeenTutorials(null);
    navigate("/login");
  };

  // Re-fetch del perfil (tras editar nombre, negocio, etc.)
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(normalizeUser(res.data.data ?? res.data));
    } catch { /* ignore — la sesión sigue con los datos previos */ }
  }, []);

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
      value={{ user, token, isLoading, permissions, can, login, logout, logoutAll, refreshUser, seenTutorials, markTutorialSeen }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
