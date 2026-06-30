import { useAuth } from "../auth/AuthContext";
import StaffDashboard from "../pages/staff/StaffDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import SuperAdminDashboard from "../pages/dashboard/SuperAdminDashboard";

export default function Admin() {
  const { isSuperAdmin, access, user } = useAuth();
  // Owners/admins get the Manager dashboard even if their Staff record isn't org-wide —
  // the role is what matters here (some owner accounts have orgWide=false in data).
  const roleName = user?.role?.name?.trim().toLowerCase();
  const isOwner =
    !isSuperAdmin && (access?.orgWide || roleName === "owner" || roleName === "admin");
  const isStaff = !isSuperAdmin && !isOwner;

  return (
    <div className="mx-wd">
      {isStaff && <StaffDashboard />}
      {isOwner && <ManagerDashboard />}
      {isSuperAdmin && <SuperAdminDashboard />}
    </div>
  );
}