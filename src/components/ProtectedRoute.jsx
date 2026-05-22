import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageLoader } from "./ui/Spinner";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;


  // 🔐 If not logged in → go to login page
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ If authenticated → allow access
  return children;
}
