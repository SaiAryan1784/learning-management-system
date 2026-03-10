import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

export default function DashboardLayout() {
  const { logout, user, access, loading, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  if (loading) return null;

  // ================= ROLE DETECTION =================
  const isSuperAdmin = user?.isPlatformAdmin === true;
  const isOwnerAdmin = !isSuperAdmin && access?.orgWide === true;
  const isStaff = !isSuperAdmin && access?.orgWide !== true;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navFullClass = ({ isActive }) =>
    isActive ? "nav-item-full active" : "nav-item-full";

  const navGridClass = ({ isActive }) =>
    isActive ? "nav-item-grid active" : "nav-item-grid";

  // ================= MANAGEMENT MENU =================
  const managementMenu = [
    {
      label: "Locations",
      icon: "fa-location-dot",
      path: "/dashboard/locations",
      permission: "locations:read",
    },
    {
      label: "Roles",
      icon: "fa-user-gear",
      path: "/dashboard/roles",
      permission: "roles:read",
    },
    {
      label: "Staff",
      icon: "fa-users",
      path: "/dashboard/staff",
      permission: "staff:read",
    },
    {
      label: "Categories",
      icon: "fa-book-open-reader",
      path: "/dashboard/course-categories",
      permission: "course-categories:read",
    },
    {
      label: "Courses",
      icon: "fa-book",
      path: "/dashboard/courses",
      permission: "courses:read",
    },
    {
      label: "Assessments",
      icon: "fa-clipboard-check",
      path: "/dashboard/assessments",
      permission: "assessments:read",
    },
    {
      label: "Certificates",
      icon: "fa-certificate",
      path: "/dashboard/certificates",
      permission: "certificates:read",
    },
  ];

  // ================= COMPLIANCE MENU =================
  const complianceMenu = [
    {
      label: "Compliance Settings",
      icon: "fa-sliders",
      path: "/dashboard/compliance/settings",
      permission: "settings:read",
    },
    {
      label: "Policies",
      icon: "fa-shield-halved",
      path: "/dashboard/compliance/policies",
      permission: "settings:read",
    },
    {
      label: "Run Assignments",
      icon: "fa-play",
      path: "/dashboard/compliance/run-assignments",
      permission: "settings:update",
    },
  ];

  // ================= REPORTS MENU =================
  const reportsMenu = [
    {
      label: "Compliance Overview",
      icon: "fa-chart-line",
      path: "/dashboard/reports/compliance",
      permission: "reports:read",
    },
    {
      label: "Staff Compliance",
      icon: "fa-user-check",
      path: "/dashboard/reports/staff-compliance",
      permission: "reports:read",
    },
    {
      label: "Certificate Expiry",
      icon: "fa-clock",
      path: "/dashboard/reports/certificates-expiry",
      permission: "reports:read",
    },
    {
      label: "Notification Logs",
      icon: "fa-bell",
      path: "/dashboard/reports/notification-logs",
      permission: "reports:read",
    },
    {
      label: "Audit Trail",
      icon: "fa-list",
      path: "/dashboard/reports/audit-trail",
      permission: "reports:read",
    },
  ];

  return (
    <div
      className={`dash-cnt ${
        sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
      }`}
    >
      {/* ================= SIDEBAR ================= */}
      <nav className="sidebar">
        <div className="logo">
          <img
            src="/images/lms-logo.png"
            className="nv-img"
            alt="Brand Logo"
          />
        </div>

        {/* DASHBOARD */}
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

        {/* OWNER / ADMIN */}
        {isOwnerAdmin && (
          <>
            {/* MANAGEMENT */}
            <h3 className="menu-heading">MANAGEMENT</h3>
            <div className="nav-grid">
              {managementMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navGridClass}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* COMPLIANCE */}
            <h3 className="menu-heading">COMPLIANCE</h3>
            <div className="nav-grid">
              {complianceMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navGridClass}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* REPORTS */}
            <h3 className="menu-heading">REPORTS</h3>
            <div className="nav-grid">
              {reportsMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navGridClass}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* STAFF */}
        {isStaff && (
          <div className="nav-grid">
            {managementMenu
              .filter((item) => hasPermission?.(item.permission))
              .map((item) => (
                <NavLink key={item.path} to={item.path} className={navGridClass}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </div>
        )}
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <div className="main-data">
        <div className="main-hdr">
          <div className="mx-wd">
            <div className="hdr-wp">

              {/* HAMBURGER */}
              <span
                className="hamburger-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <i className="fa-solid fa-bars"></i>
              </span>

              {/* NOTIFICATION BELL */}
              <div className="notification-bell mx-3">
                <i className="fa-solid fa-bell"></i>
              </div>

              {/* PROFILE */}
              <div
                className="profile-section"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <span className="profile-name">
                  {user?.name || "User"}
                </span>
                <i className="fa-solid fa-chevron-down"></i>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <i className="fa-solid fa-sign-out"></i>
                      Logout
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <Outlet />
      </div>
    </div>
  );
}