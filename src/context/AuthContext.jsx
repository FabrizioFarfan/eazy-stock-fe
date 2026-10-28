import { setBusinessCurrency } from "../utils/formatMoney";
import { setDefaultCountry } from "../utils/phone";
import { setRegion, setBusinessLocale } from "../i18n/region";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { announceToken } from "../services/wsClient";
import { getMyPermissions } from "../services/endpoints/permissions";
import { tutorialsApi } from "../services/endpoints/tutorials";
import { myBusinessesApi } from "../services/endpoints/myBusinesses";
import { saveSetupPending } from "../utils/setupPendingNotice";
import { markCodeSent, clearCodeSent } from "../utils/emailCode";
import { VERIFY_CODE_PATH, isEmailGated, afterVerifyPath } from "../utils/emailGate";

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
const normalizeUser = (u) => {
  // La moneda y el país del negocio viven en /auth/me: se fijan como valores
  // globales para que formatPrice() y los teléfonos no tengan que pasarlos.
  // Multi-país (24-oct-2026): también decimales, símbolo, locale, formato de
  // fecha y la capa de textos de España (usuario sin negocio → la del navegador).
  if (u) applyBusinessFormat(u);

  return u && u.role === "BOSS" ? { ...u, role: "SUPER_ADMIN", isBoss: true } : u;
};

function applyBusinessFormat(u) {
  setBusinessCurrency(u);
  setDefaultCountry(u?.countryCode);
  setBusinessLocale(u ? { locale: u.locale, dateFormat: u.dateFormat } : null);
  setRegion(u?.countryCode || null);
}

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
  const queryClient = useQueryClient();

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
        // Sin el código, el API responde 403 EMAIL_NOT_VERIFIED a todo menos /auth/**: no se pide nada más.
        if (!isEmailGated(userData)) await Promise.all([loadPermissions(), loadTutorials(userData)]);
      })
      .catch(() => {
        localStorage.removeItem("eazystock_token");
        localStorage.removeItem("eazystock_refresh_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login y registro devuelven el mismo shape: { accessToken, refreshToken, user }.
  // API 1.16.0: `emailVerificationRequired` viene en el AuthResponse (y en el user); con true
  // la sesión existe pero solo sirve para la pantalla del código (el API ya mandó uno).
  const _startSession = async (data) => {
    const { accessToken, refreshToken, user: rawUser } = data;
    const gated = (data.emailVerificationRequired ?? rawUser?.emailVerificationRequired) === true;
    const userData = { ...rawUser, emailVerificationRequired: gated };

    localStorage.setItem("eazystock_token", accessToken);
    localStorage.setItem("eazystock_refresh_token", refreshToken);
    announceToken();
    setToken(accessToken);
    setUser(normalizeUser(userData));

    if (gated) {
      markCodeSent(userData.id ?? userData.email);
      navigate(VERIFY_CODE_PATH);
      return;
    }
    await Promise.all([loadPermissions(), loadTutorials(userData)]);

    navigate(REDIRECT_BY_ROLE[userData.role] ?? "/dashboard");
  };

  // Cambiar el correo (API 1.18.0, EMAIL-CHANGE-SPEC.md): el JWT lleva el correo, así que el API
  // devuelve una sesión nueva que reemplaza a la vieja (el token viejo ya da 401). Sin navegar:
  // la pantalla que lo pidió sigue donde está. Devuelve el usuario nuevo.
  const replaceSession = useCallback((data) => {
    const { accessToken, refreshToken, user: rawUser } = data ?? {};
    if (!accessToken || !refreshToken || !rawUser) throw new Error("AuthResponse incompleto");
    const gated = (data.emailVerificationRequired ?? rawUser.emailVerificationRequired) === true;
    const userData = { ...rawUser, emailVerificationRequired: gated };
    localStorage.setItem("eazystock_token", accessToken);
    localStorage.setItem("eazystock_refresh_token", refreshToken);
    announceToken();
    setToken(accessToken);
    setUser(normalizeUser(userData));
    // Sin confirmar: el API ya mandó el código al correo nuevo (recargar no debe pedir otro).
    if (gated) markCodeSent(userData.id ?? userData.email);
    return userData;
  }, []);

  // Código correcto → UserResponse sin el bloqueo; se cargan permisos y tutoriales y se sigue
  // el camino de siempre (/bienvenida, o Tu plan con setupPending).
  // react-router navega en una transición (después de setUser): `justVerified` le dice a la
  // pantalla del código que no redirija ella al inicio mientras llega la navegación.
  const [justVerified, setJustVerified] = useState(false);
  const _finishVerification = useCallback(async (userData) => {
    clearCodeSent();
    const u = { ...userData, emailVerificationRequired: false };
    await Promise.all([loadPermissions(), loadTutorials(u)]);
    setJustVerified(true);
    setUser(normalizeUser(u));
    navigate(afterVerifyPath(u), { replace: true });
  }, [loadPermissions, loadTutorials, navigate]);

  const verifyEmailCode = async (code) => {
    const res = await api.post("/auth/verify/code", { code });
    await _finishVerification(res.data?.data ?? res.data);
  };

  // Cualquier 403 EMAIL_NOT_VERIFIED (api.js lo avisa con este evento): se marca al usuario y
  // ProtectedRoute lo manda a la pantalla del código.
  useEffect(() => {
    const onGated = () => setUser((u) => (u && !isEmailGated(u) ? { ...u, emailVerificationRequired: true } : u));
    window.addEventListener("eazystock:email-not-verified", onGated);
    return () => window.removeEventListener("eazystock:email-not-verified", onGated);
  }, []);

  // Devuelve el AuthResponse: la pantalla de login mira `accountReactivated`
  // (borrado de cuenta cancelado al volver a entrar, API 1.14.0).
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    await _startSession(res.data);
    return res.data;
  };

  // Registro propio (M1 «Planes en serio», 15-oct-2026): crea negocio + OWNER con
  // prueba gratis de 14 días y entra directo al panel (ahí salta el tutorial de bienvenida).
  // API 1.15.0: con `setupPending` (documento que ya usó su prueba) la cuenta nace sin
  // prueba → a Ajustes › Tu plan con el aviso, no a «Carga tu catálogo».
  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    if (res.data?.setupPending) {
      saveSetupPending({ businessId: res.data.user?.businessId, countryCode: payload.countryCode });
    }
    await _startSession(res.data);
    // API 1.16.0: con el correo sin confirmar, _startSession ya fue a la pantalla del código;
    // el camino de abajo lo sigue _finishVerification al poner el código.
    if ((res.data?.emailVerificationRequired ?? res.data?.user?.emailVerificationRequired) === true) return res.data;
    // Cuenta nueva (20-oct-2026): primero «Carga tu catálogo», no un panel vacío.
    navigate(res.data?.setupPending ? "/settings#plan" : "/bienvenida");
    return res.data;
  };

  // Varios negocios por dueño (15-oct-2026): el token lleva el businessId, así que
  // cambiar de negocio = tokens nuevos + sesión de cero (sin cerrar sesión). Se
  // vacía la caché de react-query porque casi nada va keyed por negocio.
  const switchBusiness = async (businessId) => {
    const res = await myBusinessesApi.switchTo(businessId);
    queryClient.clear();
    await _startSession(res.data);
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

  // Borrado de cuenta pedido (API 1.14.0): el BE ya revocó todos los tokens,
  // así que no se llama a /auth/logout (daría 401 → refresh → «sesión expiró»).
  const endSessionLocally = () => { queryClient.clear(); _clearSession(); };

  const _clearSession = () => {
    localStorage.removeItem("eazystock_token");
    localStorage.removeItem("eazystock_refresh_token");
    setToken(null);
    setUser(null);
    setPermissions(null);
    setSeenTutorials(null);
    applyBusinessFormat(null);
    navigate("/login");
  };

  // Re-fetch del perfil (tras editar nombre, negocio, etc.). Devuelve el usuario o null.
  // Si estaba bloqueado por el correo y ya no (confirmó con el enlace), carga permisos y tutoriales;
  // con `continueIfVerified` (pantalla del código) además sigue el camino de siempre.
  const gatedRef = useRef(false);
  useEffect(() => { gatedRef.current = isEmailGated(user); }, [user]);
  const refreshUser = useCallback(async ({ continueIfVerified = false } = {}) => {
    try {
      const res = await api.get("/auth/me");
      const userData = res.data.data ?? res.data;
      if (gatedRef.current && !isEmailGated(userData)) {
        if (continueIfVerified) { await _finishVerification(userData); return userData; }
        clearCodeSent();
        await Promise.all([loadPermissions(), loadTutorials(userData)]);
      }
      setUser(normalizeUser(userData));
      return userData;
    } catch { return null; /* la sesión sigue con los datos previos */ }
  }, [loadPermissions, loadTutorials, _finishVerification]);

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
      value={{ user, token, isLoading, permissions, can, login, register, switchBusiness, logout, logoutAll, endSessionLocally, refreshUser, replaceSession, verifyEmailCode, justVerified, seenTutorials, markTutorialSeen }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
