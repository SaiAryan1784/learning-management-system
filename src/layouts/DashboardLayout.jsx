import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState, useRef } from "react";

export default function DashboardLayout() {
  const { logout, user, access, loading } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  const dropdownRef = useRef();

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotifications();

    // close dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ================= FETCH =================
  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${API}/notifications/me?channel=in_app&page=1&limit=10`,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
        }
      );

      const data = await res.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // ================= MARK SINGLE =================
  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
        },
      });

      fetchNotifications(); // refresh
    } catch (err) {
      console.error("Error marking notification:", err);
    }
  };

  // ================= MARK ALL =================
  const markAllAsRead = async () => {
    try {
      await fetch(`${API}/notifications/me/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
        },
      });

      fetchNotifications();
    } catch (err) {
      console.error("Error marking all:", err);
    }
  };
  if (loading) return null;

  // ================= ROLE DETECTION (FIXED) =================
  const roleName = user?.role?.name?.trim().toLowerCase();

  const isSuperAdmin = user?.isPlatformAdmin === true;

  const isOwnerAdmin =
    !isSuperAdmin && (roleName === "admin" || roleName === "owner");

  const isStaff =
    !isSuperAdmin && roleName !== "admin" && roleName !== "owner";

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
    },
    {
      label: "Staff",
      icon: "fa-users",
      path: "/dashboard/staff",
    },
    {
      label: "Course Category",
      icon: "fa-book-open-reader",
      path: "/dashboard/course-categories",
    },
    // {
    //   label: "Add Course",
    //   icon: "fa-plus",
    //   path: "/dashboard/course-add",
    // },
    {
      label: "Course",
      icon: "fa-book",
      path: "/dashboard/courses",
    },
    {
      label: "Certificates",
      icon: "fa-certificate",
      path: "/dashboard/certificates",
    },
  ];

  // ================= COMPLIANCE MENU =================
  const complianceMenu = [
    {
      label: "Compliance Settings",
      icon: "fa-sliders",
      path: "/dashboard/compliance/settings",
    },
    {
      label: "Policies",
      icon: "fa-shield-halved",
      path: "/dashboard/compliance/policies",
    },
    // {
    //   label: "Run Assignments",
    //   icon: "fa-play",
    //   path: "/dashboard/compliance/run-assignments",
    // },
  ];

  // ================= REPORTS MENU =================
  const reportsMenu = [
    {
      label: "Compliance Overview",
      icon: "fa-chart-line",
      path: "/dashboard/reports/compliance",
    },
    {
      label: "Staff Compliance",
      icon: "fa-user-check",
      path: "/dashboard/reports/staff-compliance",
    },
    {
      label: "Certificate Expiry",
      icon: "fa-clock",
      path: "/dashboard/reports/certificate-expiry",
    },
    {
      label: "Notification Logs",
      icon: "fa-bell",
      path: "/dashboard/reports/notification-logs",
    },
    {
      label: "Audit Trail",
      icon: "fa-list",
      path: "/dashboard/reports/audit-trail",
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
            src="/images/lms-white.png"
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
            {managementMenu.map((item) => (
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

              {/* NOTIFICATION */}
              <div className="nav-item dropdown notification-wrapper" ref={dropdownRef}>
  
                {/* 🔔 Bell Trigger */}
                <span
                  className="notification-bell dropdown-toggle position-relative d-block mx-3"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(!open);
                  }}
                >
                  <i className="fa-solid fa-bell"></i>

                  {/* 🔴 Count Badge */}
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "3px",
                        background: "#db767c",
                        color: "#fff",
                        borderRadius: "50%",
                        fontSize: "10px",
                        padding: "5px",
                        fontWeight: "bold",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </span>

                {/* 📩 Dropdown */}
                {open && (
                  <ul
                    className="dropdown-menu show"
                    style={{
                      width: "auto",
                      maxHeight: "500px",
                      overflowY: "auto",
                      right: 0,
                      left: "auto",
                    }}
                  >
                    {/* Header */}
                    <li className="dropdown-item d-flex justify-content-between align-items-center">
                      <p className="not-tl">Notifications</p>

                      {notifications.length > 0 && (
                        <button style={{color:"#059669"}}
                          className="btn btn-sm"
                          onClick={markAllAsRead}
                        >
                          Mark all
                        </button>
                      )} 
                    </li>

                    <li><hr className="dropdown-divider" /></li>

                    {/* No Notifications */}
                    {notifications.length === 0 && (
                      <li className="dropdown-item text-center">
                       <p className="no-not"> No new notifications</p>
                      </li>
                    )}

                    {/* Notification List */}
                    {notifications.map((n) => (
                      <li
                        key={n._id}
                        className="dropdown-item"
                        onClick={() => markAsRead(n._id)}
                      >
                        <div className="dropdown-link">
                          <p>
                          {n.title}
                          <span>{n.message}</span>
                          <span style={{ fontSize: "11px", color: "#999" }}>
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* PROFILE */}
              <div
                className="profile-section"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <span className="profile-name">
                  {user?.name || "User"}
                </span>
                  {/* {roleName} */}

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