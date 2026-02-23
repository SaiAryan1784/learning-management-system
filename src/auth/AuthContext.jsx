import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Restore auth from localStorage on app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("lmsUser");
      const storedRole = localStorage.getItem("lmsRole");
      const storedAccess = localStorage.getItem("lmsAccess");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedRole) setRole(JSON.parse(storedRole));
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
      localStorage.setItem("accessToken", data.accessToken?.accessToken);
      localStorage.setItem("lmsUser", JSON.stringify(data.user));
      localStorage.setItem("lmsRole", JSON.stringify(data.role));
      localStorage.setItem("lmsAccess", JSON.stringify(data.access));

      // 🔥 Only owner/admin has organization
      if (data.organization?.id) {
        localStorage.setItem("organizationId", data.organization.id);
      } else {
        localStorage.removeItem("organizationId");
      }

      setUser(data.user);
      setRole(data.role);
      setAccess(data.access);
    } catch (error) {
      console.error("Login storage error:", error);
    }
  };

  // 🚪 Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("lmsUser");
    localStorage.removeItem("lmsRole");
    localStorage.removeItem("lmsAccess");
    localStorage.removeItem("organizationId");

    setUser(null);
    setRole(null);
    setAccess(null);
  };

  // 👑 Super Admin check
  const isSuperAdmin = user?.isPlatformAdmin === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        access,
        loading,
        login,
        logout,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);
