import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect } from "react";

export default function DashboardLayout() {
  const { logout, isSuperAdmin, access } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOwner = !isSuperAdmin && access?.orgWide;
  const isStaff = !isSuperAdmin && !access?.orgWide;

//   useEffect(() => {
//   if (!access) return;

//   if (location.pathname !== "/dashboard") return;

//   let targetPath = null;

//   if (isSuperAdmin) {
//     targetPath = "/dashboard/modules";
//   } else if (isOwner) {
//     targetPath = "/dashboard/manager";
//   } else if (isStaff) {
//     targetPath = "/dashboard/staff";
//   }

//   if (targetPath && location.pathname !== targetPath) {
//     navigate(targetPath, { replace: true });
//   }
// }, [access]); // ✅ ONLY depend on access

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navFullClass = ({ isActive }) =>
    isActive ? "nav-item-full active" : "nav-item-full";

  const navGridClass = ({ isActive }) =>
    isActive ? "nav-item-grid active" : "nav-item-grid";

  return (
    <div className="dash-cnt">
      <nav className="sidebar">
        <div className="logo">
          <img src="/images/lms-logo.png" className="nv-img" alt="Brand Logo" />
        </div>

        <NavLink to="/dashboard" end className={navFullClass}>
          <i className="fa-solid fa-house"></i>
          <span>Dashboard</span>
        </NavLink>

        {/* SUPER ADMIN */}
        {isSuperAdmin && (
          <div className="nav-grid">
            <NavLink to="/dashboard/modules" className={navGridClass}>
              <i className="fa-solid fa-business-time"></i>
              <span>Modules</span>
            </NavLink>
          </div>
        )}

        {/* OWNER / MANAGER */}
        {(isOwner || isSuperAdmin) && (
          <>
            <h3 className="menu-heading">MANAGEMENT</h3>

            <div className="nav-grid">
              <NavLink to="/dashboard/locations" className={navGridClass}>
                <i className="fa-solid fa-location-dot"></i>
                <span>Locations</span>
              </NavLink>

              <NavLink to="/dashboard/roles" className={navGridClass}>
                <i className="fa-solid fa-user-gear"></i>
                <span>Roles</span>
              </NavLink>

              <NavLink to="/dashboard/staff" className={navGridClass}>
                <i className="fa-solid fa-users"></i>
                <span>Staff</span>
              </NavLink>

              {/* ✅ FIXED STAFF PROGRESS ROUTE */}
              <NavLink
                to="/dashboard/course-categories"
                className={navGridClass}
              >
                <i className="fa-solid fa-book-open-reader"></i>
                <span>Categories</span>
              </NavLink>

              <NavLink to="/dashboard/courses" className={navGridClass}>
                <i className="fa-solid fa-book"></i>
                <span>Courses</span>
              </NavLink>
            </div>
          </>
        )}

        {/* STAFF */}
        {isStaff && (
          <div className="nav-grid">
            <NavLink to="/dashboard/staff" className={navGridClass}>
              <i className="fa-solid fa-graduation-cap"></i>
              <span>My Courses</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="main-data">
        <div className="main-hdr">
          <div className="mx-wd">
            <div className="hdr-wp">
              <span className="logout-btn" onClick={handleLogout}>
                <i className="fa-solid fa-sign-out"></i>
              </span>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}