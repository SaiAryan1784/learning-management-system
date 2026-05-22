import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState, useRef, Suspense } from "react";
import { SectionLoader } from "../components/ui/Spinner";

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

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
        },
      });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification:", err);
    }
  };

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

  const roleName = user?.role?.name?.trim().toLowerCase();
  const isSuperAdmin = user?.isPlatformAdmin === true;
  const isOwnerAdmin = !isSuperAdmin && (roleName === "admin" || roleName === "owner");
  const isStaff = !isSuperAdmin && roleName !== "admin" && roleName !== "owner";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 no-underline transition-all duration-200",
      sidebarOpen ? "" : "justify-center",
      isActive
        ? "bg-emerald text-white"
        : "text-white/60 hover:bg-white/10 hover:text-white",
    ]
      .filter(Boolean)
      .join(" ");

  const managementMenu = [
    { label: "Locations", icon: "fa-location-dot", path: "/dashboard/locations" },
    { label: "Staff", icon: "fa-users", path: "/dashboard/staff" },
    { label: "Course Category", icon: "fa-book-open-reader", path: "/dashboard/course-categories" },
    { label: "Certificates", icon: "fa-certificate", path: "/dashboard/certificates" },
  ];

  const complianceMenu = [
    { label: "Compliance Settings", icon: "fa-sliders", path: "/dashboard/compliance/settings" },
    { label: "Policies", icon: "fa-shield-halved", path: "/dashboard/compliance/policies" },
  ];

  const reportsMenu = [
    { label: "Compliance Overview", icon: "fa-chart-line", path: "/dashboard/reports/compliance" },
    { label: "Staff Compliance", icon: "fa-user-check", path: "/dashboard/reports/staff-compliance" },
    { label: "Certificate Expiry", icon: "fa-clock", path: "/dashboard/reports/certificate-expiry" },
    { label: "Notification Logs", icon: "fa-bell", path: "/dashboard/reports/notification-logs" },
    { label: "Audit Trail", icon: "fa-list", path: "/dashboard/reports/audit-trail" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* ================= SIDEBAR ================= */}
      <nav
        className={[
          "sticky top-0 h-screen flex flex-col overflow-y-auto overflow-x-hidden",
          "bg-charcoal transition-all duration-300 ease-in-out flex-shrink-0",
          sidebarOpen ? "w-[220px]" : "w-[64px]",
        ].join(" ")}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3A3A3C #1C1C1E" }}
      >
        {/* Logo */}
        <div
          className={[
            "flex items-center px-3 py-4 border-b border-charcoal-light",
            sidebarOpen ? "justify-start gap-3" : "justify-center",
          ].join(" ")}
        >
          <img
            src="/images/lms-white.png"
            className={sidebarOpen ? "w-32 object-contain" : "w-8 object-contain"}
            alt="Brand Logo"
          />
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-2 py-3">
          {/* DASHBOARD */}
          <NavLink to="/dashboard" end className={navClass}>
            <i className="fa-solid fa-house text-base flex-shrink-0"></i>
            {sidebarOpen && (
              <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                Dashboard
              </span>
            )}
          </NavLink>

          {/* SUPER ADMIN */}
          {isSuperAdmin && (
            <NavLink to="/dashboard/modules" className={navClass}>
              <i className="fa-solid fa-business-time text-base flex-shrink-0"></i>
              {sidebarOpen && (
                <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                  Modules
                </span>
              )}
            </NavLink>
          )}

          {/* OWNER / ADMIN */}
          {isOwnerAdmin && (
            <>
              {sidebarOpen && (
                <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1 mt-5 mb-2">
                  Management
                </h3>
              )}
              {!sidebarOpen && <div className="my-2 border-t border-charcoal-light" />}
              {managementMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navClass}>
                  <i className={`fa-solid ${item.icon} text-base flex-shrink-0`}></i>
                  {sidebarOpen && (
                    <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}

              {sidebarOpen && (
                <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1 mt-5 mb-2">
                  Compliance
                </h3>
              )}
              {!sidebarOpen && <div className="my-2 border-t border-charcoal-light" />}
              {complianceMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navClass}>
                  <i className={`fa-solid ${item.icon} text-base flex-shrink-0`}></i>
                  {sidebarOpen && (
                    <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}

              {sidebarOpen && (
                <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1 mt-5 mb-2">
                  Reports
                </h3>
              )}
              {!sidebarOpen && <div className="my-2 border-t border-charcoal-light" />}
              {reportsMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navClass}>
                  <i className={`fa-solid ${item.icon} text-base flex-shrink-0`}></i>
                  {sidebarOpen && (
                    <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </>
          )}

          {/* STAFF */}
          {isStaff && (
            <>
              {managementMenu.map((item) => (
                <NavLink key={item.path} to={item.path} className={navClass}>
                  <i className={`fa-solid ${item.icon} text-base flex-shrink-0`}></i>
                  {sidebarOpen && (
                    <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 flex flex-col bg-canvas">

        {/* TOPBAR */}
        <header className="sticky top-0 z-40 bg-surface border-b border-brand-border h-14 flex items-center px-4 gap-2 flex-shrink-0">

          {/* Hamburger */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg text-brand-muted hover:bg-brand-border/60 hover:text-brand-text transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="fa-solid fa-bars text-sm"></i>
          </button>

          <div className="flex-1" />

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-brand-muted hover:bg-brand-border/60 hover:text-brand-text transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
              }}
            >
              <i className="fa-solid fa-bell text-sm"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-brand-border rounded-xl shadow-card z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
                  <span className="text-xs font-bold text-brand-text uppercase tracking-wide">
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <button
                      className="text-xs font-semibold text-emerald hover:text-emerald-hover transition-colors"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-brand-border">
                  {notifications.length === 0 && (
                    <p className="text-center text-xs text-brand-muted py-6 uppercase tracking-wide">
                      No new notifications
                    </p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n._id}
                      className="w-full text-left px-4 py-3 hover:bg-canvas transition-colors block"
                      onClick={() => markAsRead(n._id)}
                    >
                      <p className="text-xs font-semibold text-brand-text">{n.title}</p>
                      <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-brand-muted/60 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-brand-border/60 transition-colors"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="w-7 h-7 rounded-full bg-emerald flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-brand-text hidden sm:block max-w-[120px] truncate">
                {user?.name || "User"}
              </span>
              <i className="fa-solid fa-chevron-down text-[10px] text-brand-muted"></i>
            </button>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-1 bg-surface border border-brand-border rounded-xl shadow-card w-36 z-50 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-brand-danger hover:bg-brand-danger/5 transition-colors"
                >
                  <i className="fa-solid fa-sign-out text-xs"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6">
          <Suspense fallback={<SectionLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
