import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import api, { refreshSession } from "../api/api";

const AuthContext = createContext();

// Refresh this far before the access token expires, so a long form submit never
// lands on an expired token.
const REFRESH_LEAD_MS = 2 * 60 * 1000;

const AUTH_KEYS = [
  "accessToken",
  "accessTokenExpiresAt",
  "lmsUser",
  "lmsPermissions",
  "lmsAccess",
  "organizationId",
  "adminSnapshot",
  "impersonating",
  "remember",
  "loginTime",
];

function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

const readJson = (key) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

/** The identity currently in localStorage: user, permissions, access. */
function readStoredIdentity() {
  return {
    user: readJson("lmsUser"),
    permissions: readJson("lmsPermissions") || [],
    access: readJson("lmsAccess"),
  };
}

/**
 * Mid-impersonation, /auth/refresh returns the platform admin's own session — which
 * would snap the UI out of the org being viewed. Re-assert the impersonated identity
 * over what the refresh wrote.
 */
function reapplyImpersonatedIdentity() {
  const session = readJson("impersonating")?.session;
  if (!session?.user) return;

  localStorage.setItem("lmsUser", JSON.stringify(session.user));
  localStorage.setItem("lmsPermissions", JSON.stringify(session.permissions || []));
  localStorage.setItem("lmsAccess", JSON.stringify(session.access));
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(null); // { orgName, orgId }
  const [remembered, setRemembered] = useState(() => localStorage.getItem("remember") === "true");
  const refreshTimer = useRef(null);

  // 👑 Super Admin check
  const isSuperAdmin = user?.isPlatformAdmin === true;

  // 🔥 Restore auth on app load.
  //
  // localStorage is only the optimistic first paint. The authority is the httpOnly
  // refresh cookie: we exchange it for a fresh access token before rendering. That is
  // what makes a remembered session survive an access token that expired overnight —
  // previously the stale token produced a 401 and bounced the user to /login.
  useEffect(() => {
    let cancelled = false;

    const applyIdentity = ({ user: u, permissions: p, access: a }) => {
      setUser(u);
      setPermissions(p);
      setAccess(a);
    };

    const restore = async () => {
      let stored;

      try {
        stored = readStoredIdentity();
        applyIdentity(stored);

        // Restore the "Viewing as" banner across reloads (org context comes from the
        // x-organization-id header; without this the banner vanished on refresh).
        setImpersonating(readJson("impersonating"));
      } catch (error) {
        console.error("Auth restore error:", error);
        localStorage.clear();
        setLoading(false);
        return;
      }

      // Nobody was logged in here — no cookie exchange to attempt.
      if (!stored.user) {
        setLoading(false);
        return;
      }

      try {
        await refreshSession();
        if (cancelled) return;

        reapplyImpersonatedIdentity();
        // refreshSession() rewrote localStorage from the server response; re-read it
        // so a role or permission change made since last login takes effect now.
        applyIdentity(readStoredIdentity());
      } catch {
        // Cookie is gone, expired or revoked — this is a genuinely dead session.
        if (cancelled) return;
        clearAuthStorage();
        applyIdentity({ user: null, permissions: [], access: null });
        setImpersonating(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  // ⏱️ Proactive refresh — renew shortly before the access token expires so an
  // in-flight action never has to eat a 401 first.
  useEffect(() => {
    if (!user) return;

    const scheduleNext = () => {
      const expiresAt = Number(localStorage.getItem("accessTokenExpiresAt") || 0);
      const delay = Math.max(expiresAt - Date.now() - REFRESH_LEAD_MS, 30_000);

      refreshTimer.current = setTimeout(async () => {
        try {
          await refreshSession();
        } catch {
          // The response interceptor owns the logout path; nothing to do here.
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [user]);

  // 🔐 Login function
  const login = (data) => {
  try {
    const userData = {
      ...data.user,
      role: data.role, // 👈 IMPORTANT FIX
    };

    const perms = data.role?.permissions || [];

    // Tolerant read: the server used to nest the token ({accessToken, refreshToken})
    // and now returns a plain string. Accepting both means the frontend can deploy
    // ahead of the backend without breaking login in between.
    localStorage.setItem(
      "accessToken",
      data.accessToken?.accessToken ?? data.accessToken
    );
    if (data.accessTokenExpiresIn) {
      localStorage.setItem(
        "accessTokenExpiresAt",
        String(Date.now() + data.accessTokenExpiresIn * 1000)
      );
    }
    localStorage.setItem("lmsUser", JSON.stringify(userData));
    localStorage.setItem("lmsPermissions", JSON.stringify(perms));
    localStorage.setItem("lmsAccess", JSON.stringify(data.access));

    if (data.organization?.id) {
      localStorage.setItem("organizationId", data.organization.id);
    } else {
      localStorage.removeItem("organizationId");
    }

    setUser(userData); // 👈 use updated user
    setPermissions(perms);
    setAccess(data.access);
    // Login.jsx writes the "remember" flag to localStorage just before calling login() —
    // pick it up here so useIdleLogout reacts immediately (no full page reload happens).
    setRemembered(localStorage.getItem("remember") === "true");
  } catch (error) {
    console.error("Login storage error:", error);
  }
};

  // 🚪 Logout function
  const logout = () => {
    // Revoke the refresh-token family server-side and clear the cookie. Without this
    // the cookie would outlive the click and the next page load would silently
    // resurrect the session.
    api.post("/auth/logout").catch(() => {
      /* Offline or already-dead session — local teardown below still applies. */
    });

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    clearAuthStorage();

    setUser(null);
    setPermissions([]);
    setAccess(null);
    setRemembered(false);
    setImpersonating(null);
  };

  // 🔀 Impersonation — platform admin switches into a client org.
  //
  // The admin keeps their OWN access token and refresh cookie. Org scoping travels in
  // the x-organization-id header, which authMiddleware resolves to that org's owner
  // staff for platform admins. Swapping tokens (as this used to) cannot work now that
  // one refresh cookie defines the session — the cookie and the access token would
  // describe two different identities.
  const impersonate = (data) => {
    try {
      const snapshot = {
        lmsUser: localStorage.getItem("lmsUser"),
        lmsPermissions: localStorage.getItem("lmsPermissions"),
        lmsAccess: localStorage.getItem("lmsAccess"),
        organizationId: localStorage.getItem("organizationId"),
      };
      localStorage.setItem("adminSnapshot", JSON.stringify(snapshot));

      const userData = { ...data.user, role: data.role };
      const perms = data.role?.permissions || [];

      localStorage.setItem("lmsUser", JSON.stringify(userData));
      localStorage.setItem("lmsPermissions", JSON.stringify(perms));
      localStorage.setItem("lmsAccess", JSON.stringify(data.access));
      if (data.organization?.id) {
        localStorage.setItem("organizationId", data.organization.id);
      }

      // The impersonated identity is stored with the banner state so a page reload can
      // re-apply it: bootstrap refresh returns the *admin's* session, which would
      // otherwise snap the UI back to super-admin mid-impersonation.
      const nextImpersonating = {
        orgName: data.orgName,
        orgId: data.organization?.id,
        session: { user: userData, permissions: perms, access: data.access },
      };
      localStorage.setItem("impersonating", JSON.stringify(nextImpersonating));

      setUser(userData);
      setPermissions(perms);
      setAccess(data.access);
      setImpersonating(nextImpersonating);
    } catch (err) {
      console.error("Impersonate error:", err);
    }
  };

  const exitImpersonation = () => {
    try {
      const snapshot = JSON.parse(localStorage.getItem("adminSnapshot") || "{}");
      if (snapshot.lmsUser) localStorage.setItem("lmsUser", snapshot.lmsUser);
      if (snapshot.lmsPermissions) localStorage.setItem("lmsPermissions", snapshot.lmsPermissions);
      if (snapshot.lmsAccess) localStorage.setItem("lmsAccess", snapshot.lmsAccess);
      if (snapshot.organizationId) {
        localStorage.setItem("organizationId", snapshot.organizationId);
      } else {
        localStorage.removeItem("organizationId");
      }
      localStorage.removeItem("adminSnapshot");
      localStorage.removeItem("impersonating");

      const restoredUser = snapshot.lmsUser ? JSON.parse(snapshot.lmsUser) : null;
      const restoredPerms = snapshot.lmsPermissions ? JSON.parse(snapshot.lmsPermissions) : [];
      const restoredAccess = snapshot.lmsAccess ? JSON.parse(snapshot.lmsAccess) : null;

      setUser(restoredUser);
      setPermissions(restoredPerms);
      setAccess(restoredAccess);
      setImpersonating(null);
    } catch (err) {
      console.error("Exit impersonation error:", err);
    }
  };

  // 🔐 Permission Helpers

  const hasPermission = (permission) => {
    if (isSuperAdmin) return true;
    if (permissions.includes("*")) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionArray = []) => {
    if (isSuperAdmin) return true;
    if (permissions.includes("*")) return true;
    return permissionArray.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (permissionArray = []) => {
    if (isSuperAdmin) return true;
    if (permissions.includes("*")) return true;
    return permissionArray.every((perm) => permissions.includes(perm));
  };

  // 💎 Memoized value (prevents unnecessary re-renders)
  const value = useMemo(() => ({
    user,
    permissions,
    access,
    loading,
    login,
    logout,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    impersonating,
    impersonate,
    exitImpersonation,
    remembered,
  }), [user, permissions, access, loading, impersonating, remembered]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);