import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

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

    setUser(null);
    setPermissions([]);
    setAccess(null);
  };

  // 🔐 Permission Helpers

  const hasPermission = (permission) => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionArray = []) => {
    if (isSuperAdmin) return true;
    return permissionArray.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (permissionArray = []) => {
    if (isSuperAdmin) return true;
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
  }), [user, permissions, access, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);