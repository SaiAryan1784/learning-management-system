import { useAuth } from "../auth/AuthContext";
import StaffDashboard from "../pages/staff/StaffDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";

export default function Admin() {
  const { isSuperAdmin, access } = useAuth();
  const isOwner = !isSuperAdmin && access?.orgWide;
  const isStaff = !isSuperAdmin && !access?.orgWide;

  return (
    <div className="mx-wd">
      {isStaff && <StaffDashboard />}
      {isOwner && <ManagerDashboard />}
      {isSuperAdmin && <h2>Welcome Super Admin</h2>}
    </div>
  );
}