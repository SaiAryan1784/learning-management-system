import { useAuth } from "../auth/AuthContext";
import StaffDashboard from "../pages/staff/StaffDashboard";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import SuperAdminDashboard from "../pages/dashboard/SuperAdminDashboard";
import { PERM } from "../auth/access";

export default function Admin() {
  const { isSuperAdmin, hasPermission } = useAuth();

  // Which dashboard fits is a question about capability, not about what the
  // role happens to be called: ManagerDashboard reads other people's progress
  // and compliance reports, both gated on reports:read. Anyone else gets their
  // own learning. Managers reach their own courses via "My Learning".
  const canSeeTeam = hasPermission(PERM.reportsRead);

  if (isSuperAdmin) {
    return (
      <div className="mx-wd">
        <SuperAdminDashboard />
      </div>
    );
  }

  return (
    <div className="mx-wd">
      {canSeeTeam ? <ManagerDashboard /> : <StaffDashboard />}
    </div>
  );
}
