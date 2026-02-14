import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("lmsUser");
    const storedRole = localStorage.getItem("lmsRole");
    const storedAccess = localStorage.getItem("lmsAccess");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedRole) setRole(JSON.parse(storedRole));
    if (storedAccess) setAccess(JSON.parse(storedAccess));

    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem("accessToken", data.accessToken.accessToken);
    localStorage.setItem("lmsUser", JSON.stringify(data.user));
    localStorage.setItem("lmsRole", JSON.stringify(data.role));
    localStorage.setItem("lmsAccess", JSON.stringify(data.access));

    // 🔥 Only owner has organization
    if (data.organization?.id) {
      localStorage.setItem("organizationId", data.organization.id);
    } else {
      localStorage.removeItem("organizationId");
    }

    setUser(data.user);
    setRole(data.role);
    setAccess(data.access);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
    setAccess(null);
  };

  const isSuperAdmin = user?.isPlatformAdmin === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        access,
        login,
        logout,
        loading,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
