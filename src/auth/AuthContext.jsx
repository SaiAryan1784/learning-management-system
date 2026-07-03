import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(null); // { orgName, orgId }

  // 👑 Super Admin check
  const isSuperAdmin = user?.isPlatformAdmin === true;

  // 🔥 Restore auth from localStorage on app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("lmsUser");
      const storedPermissions = localStorage.getItem("lmsPermissions");
      const storedAccess = localStorage.getItem("lmsAccess");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedPermissions) setPermissions(JSON.parse(storedPermissions));
      if (storedAccess) setAccess(JSON.parse(storedAccess));
    } catch (error) {
      console.error("Auth restore error:", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔐 Login function
  const login = (data) => {
  try {
    const userData = {
      ...data.user,
      role: data.role, // 👈 IMPORTANT FIX
    };

    const perms = data.role?.permissions || [];

    localStorage.setItem("accessToken", data.accessToken?.accessToken);
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
  } catch (error) {
    console.error("Login storage error:", error);
  }
};

  // 🚪 Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("lmsUser");
    localStorage.removeItem("lmsPermissions");
    localStorage.removeItem("lmsAccess");
    localStorage.removeItem("organizationId");
    localStorage.removeItem("adminSnapshot");

    setUser(null);
    setPermissions([]);
    setAccess(null);
    setImpersonating(null);
  };

  // 🔀 Impersonation — platform admin switches into a client org
  const impersonate = (data) => {
    try {
      const snapshot = {
        accessToken: localStorage.getItem("accessToken"),
        lmsUser: localStorage.getItem("lmsUser"),
        lmsPermissions: localStorage.getItem("lmsPermissions"),
        lmsAccess: localStorage.getItem("lmsAccess"),
        organizationId: localStorage.getItem("organizationId"),
      };
      localStorage.setItem("adminSnapshot", JSON.stringify(snapshot));
      login(data);
      setImpersonating({ orgName: data.orgName, orgId: data.organization?.id });
    } catch (err) {
      console.error("Impersonate error:", err);
    }
  };

  const exitImpersonation = () => {
    try {
      const snapshot = JSON.parse(localStorage.getItem("adminSnapshot") || "{}");
      if (snapshot.accessToken) localStorage.setItem("accessToken", snapshot.accessToken);
      if (snapshot.lmsUser) localStorage.setItem("lmsUser", snapshot.lmsUser);
      if (snapshot.lmsPermissions) localStorage.setItem("lmsPermissions", snapshot.lmsPermissions);
      if (snapshot.lmsAccess) localStorage.setItem("lmsAccess", snapshot.lmsAccess);
      if (snapshot.organizationId) {
        localStorage.setItem("organizationId", snapshot.organizationId);
      } else {
        localStorage.removeItem("organizationId");
      }
      localStorage.removeItem("adminSnapshot");

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
  }), [user, permissions, access, loading, impersonating]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);