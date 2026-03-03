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

  const isOwnerAdmin =
    !isSuperAdmin && access?.orgWide === true;

  const isStaff =
    !isSuperAdmin && access?.orgWide !== true;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navFullClass = ({ isActive }) =>
    isActive ? "nav-item-full active" : "nav-item-full";

  const navGridClass = ({ isActive }) =>
    isActive ? "nav-item-grid active" : "nav-item-grid";

  // ================= MENU CONFIG =================
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

  return (
    <div className={`dash-cnt ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      
      {/* ================= SIDEBAR ================= */}
      <nav className="sidebar">
        <div className="logo">
          <img
            src="/images/lms-logo.png"
            className="nv-img"
            alt="Brand Logo"
          />
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

        {/* OWNER / ADMIN */}
        {isOwnerAdmin && (
          <>
            <h3 className="menu-heading">MANAGEMENT</h3>
            <div className="nav-grid">
              {managementMenu.map((item) => (
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
              .filter((item) =>
                hasPermission?.(item.permission)
              )
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

              {/* PROFILE DROPDOWN */}
              <div
                className="profile-section"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                {/* <img
                  src={user?.profileImage || "/images/profile.png"}
                  alt="Profile"
                  className="profile-img"
                /> */}
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

        <Outlet />
      </div>
    </div>
  );
}