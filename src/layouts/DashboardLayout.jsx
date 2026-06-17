import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import GlobalSearch from "../components/GlobalSearch";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageLoader, SectionLoader } from "../components/ui/Spinner";
import ChatWidget from "../components/ui/ChatWidget";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function notifIcon(type) {
  if (!type) return { icon: "fa-bell", bg: "bg-blue-500/10", color: "text-blue-400", accent: "bg-blue-400" };
  if (type.includes("assign")) return { icon: "fa-user-plus", bg: "bg-emerald/10", color: "text-emerald", accent: "bg-emerald" };
  if (type.includes("expir") || type.includes("certif")) return { icon: "fa-clock", bg: "bg-amber-400/10", color: "text-amber-400", accent: "bg-amber-400" };
  if (type.includes("compli")) return { icon: "fa-shield-halved", bg: "bg-violet-400/10", color: "text-violet-400", accent: "bg-violet-400" };
  if (type.includes("complet")) return { icon: "fa-circle-check", bg: "bg-emerald/10", color: "text-emerald", accent: "bg-emerald" };
  if (type.includes("remind")) return { icon: "fa-bell-ring", bg: "bg-orange-400/10", color: "text-orange-400", accent: "bg-orange-400" };
  return { icon: "fa-bell", bg: "bg-blue-500/10", color: "text-blue-400", accent: "bg-blue-400" };
}

export default function DashboardLayout() {
  const { logout, user, access, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnread, setPrevUnread] = useState(0);
  const [bellPulse, setBellPulse] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");

  const notifRef = useRef();
  const profileRef = useRef();

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (unreadCount > prevUnread) {
      setBellPulse(true);
      const t = setTimeout(() => setBellPulse(false), 700);
      return () => clearTimeout(t);
    }
    setPrevUnread(unreadCount);
  }, [unreadCount, prevUnread]);

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

  if (loading) return <PageLoader />;

  const roleName = user?.role?.name?.trim().toLowerCase();
  const isSuperAdmin = user?.isPlatformAdmin === true;
  const isOwnerAdmin = !isSuperAdmin && (roleName === "admin" || roleName === "owner");
  const isStaff = !isSuperAdmin && roleName !== "admin" && roleName !== "owner";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const NavItem = ({ to, icon, label, end = false }) => (
    <NavLink to={to} end={end} className="block no-underline">
      {({ isActive }) => (
        <div
          className={[
            "relative group flex items-center gap-3 rounded-lg px-3 py-3 mb-0.5 transition-colors duration-200",
            sidebarOpen ? "overflow-hidden" : "overflow-visible justify-center",
            isActive ? "text-white" : "text-white/40 hover:bg-white/10 hover:text-white/80",
          ].join(" ")}
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-lg bg-emerald"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <i className={`fa-solid ${icon} text-[15px] flex-shrink-0 relative z-10`}></i>
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis relative z-10 min-w-0"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 border border-white/10 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 pointer-events-none opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150">
              {label}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );

  const SectionLabel = ({ children }) =>
    sidebarOpen ? (
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-xs font-semibold text-white/40 px-1 mt-5 mb-1.5"
      >
        {children}
      </motion.h3>
    ) : (
      <div className="my-2 border-t border-charcoal-light" />
    );

  const managementMenu = [
    { label: "Locations", icon: "fa-location-dot", path: "/dashboard/locations" },
    { label: "Staff", icon: "fa-users", path: "/dashboard/staff" },
    { label: "Courses", icon: "fa-book-open", path: "/dashboard/courses" },
    { label: "Categories", icon: "fa-layer-group", path: "/dashboard/course-categories" },
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

  const ReportsNavGroup = () => {
    const isAnyActive = reportsMenu.some((item) => location.pathname.startsWith(item.path));

    const handleToggle = () => {
      if (!sidebarOpen) {
        setSidebarOpen(true);
        setReportsOpen(true);
      } else {
        setReportsOpen((prev) => !prev);
      }
    };

    return (
      <div>
        <button
          onClick={handleToggle}
          className={[
            "relative group w-full flex items-center gap-3 rounded-lg px-3 py-3 mb-0.5 transition-colors duration-200",
            sidebarOpen ? "overflow-hidden" : "overflow-visible justify-center",
            isAnyActive ? "text-white bg-emerald/20" : "text-white/40 hover:bg-white/10 hover:text-white/80",
          ].join(" ")}
        >
          <i className="fa-solid fa-chart-line text-[15px] flex-shrink-0 relative z-10" />
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.span
                key="reports-label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis relative z-10 flex-1 text-left"
              >
                Reports
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.i
                key="chevron"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: reportsOpen ? 180 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fa-solid fa-chevron-down text-[10px] flex-shrink-0 relative z-10"
              />
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 border border-white/10 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 pointer-events-none opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150">
              Reports
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {reportsOpen && sidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden pl-3 border-l border-white/10 ml-4"
            >
              {reportsMenu.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* ================= SIDEBAR ================= */}
      <motion.nav
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        className="sticky top-0 h-screen flex flex-col overflow-y-auto overflow-x-hidden bg-charcoal flex-shrink-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3A3A3C #1C1C1E" }}
      >
        {/* Sidebar top — toggle button aligned with topbar height */}
        <div className="h-14 border-b border-charcoal-light flex-shrink-0 flex items-center justify-center px-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center h-9 rounded-lg bg-white/8 hover:bg-emerald hover:text-white text-white/70 transition-all"
            aria-label="Toggle sidebar"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <i className={`fa-solid ${sidebarOpen ? "fa-angles-left" : "fa-angles-right"} text-sm`} />
          </motion.button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-2 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <NavItem to="/dashboard" end icon="fa-house" label="Dashboard" />

          {isSuperAdmin && (
            <NavItem to="/dashboard/modules" icon="fa-business-time" label="Modules" />
          )}

          {isOwnerAdmin && (
            <>
              <SectionLabel>Management</SectionLabel>
              {managementMenu.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
              ))}

              <SectionLabel>Compliance</SectionLabel>
              {complianceMenu.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
              ))}

              <SectionLabel>Reports</SectionLabel>
              <ReportsNavGroup />

              <SectionLabel>System</SectionLabel>
              <NavItem to="/dashboard/settings" icon="fa-gear" label="Settings" />
            </>
          )}

          {isStaff && (
            <>
              {managementMenu.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
              ))}
            </>
          )}
        </div>

      </motion.nav>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 flex flex-col bg-canvas">

        {/* TOPBAR */}
        <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-brand-border h-14 flex-shrink-0 grid grid-cols-[auto_1fr_auto] items-center px-4 gap-3">

          {/* Left — logo */}
          <img
            src="/images/lms-logo.png"
            className="h-11 object-contain flex-shrink-0"
            alt="Brand Logo"
          />

          {/* Center — search */}
          <div className="hidden md:flex justify-center">
            <GlobalSearch />
          </div>

          {/* Right — bell + profile */}
          <div className="flex items-center gap-2 justify-end">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-brand-muted hover:bg-brand-border/60 hover:text-brand-text transition-colors outline-none focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
              }}
              aria-label="Notifications"
            >
              <motion.i
                animate={bellPulse ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}
                transition={{ duration: 0.6 }}
                className="fa-solid fa-bell text-sm"
              />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {open && (() => {
                const filtered = notifFilter === "unread"
                  ? notifications.filter(n => !n.readAt)
                  : notifications;

                const today = new Date().toDateString();
                const todayItems = filtered.filter(n => new Date(n.createdAt).toDateString() === today);
                const earlierItems = filtered.filter(n => new Date(n.createdAt).toDateString() !== today);

                const NotifItem = ({ n, i }) => {
                  const isUnread = !n.readAt;
                  const { icon, bg, color, accent } = notifIcon(n.type);
                  return (
                    <motion.button
                      key={n._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.15 }}
                      onClick={() => markAsRead(n._id)}
                      className={`relative w-full text-left rounded-xl px-3 py-3 flex items-start gap-3 transition-all group outline-none focus:outline-none overflow-hidden ${
                        isUnread ? "bg-emerald/[0.04] hover:bg-emerald/[0.07]" : "hover:bg-canvas"
                      }`}
                    >
                      {/* Left accent bar for unread */}
                      {isUnread && (
                        <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${accent}`} />
                      )}
                      {/* Type icon */}
                      <div className="relative flex-shrink-0 mt-0.5 ml-1">
                        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                          <i className={`fa-solid ${icon} text-[12px] ${color}`} />
                        </div>
                        {isUnread && (
                          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${accent} border-2 border-surface`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] leading-snug text-brand-text ${isUnread ? "font-semibold" : "font-medium"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-brand-muted/60 flex-shrink-0 mt-0.5 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-[12px] text-brand-muted mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                      {/* Mark-read hover action */}
                      {isUnread && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 text-[10px] font-semibold text-brand-muted hover:text-emerald">
                          <i className="fa-solid fa-check" />
                        </span>
                      )}
                    </motion.button>
                  );
                };

                return (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full right-0 mt-2 w-[420px] bg-surface border border-brand-border/60 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right"
                  >
                    {/* Header — gradient accent strip */}
                    <div className="relative px-4 pt-4 pb-3 border-b border-brand-border/40 overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 60%)" }} />
                      <div className="relative flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald/10 flex items-center justify-center">
                            <i className="fa-solid fa-bell text-emerald text-[13px]" />
                          </div>
                          <div>
                            <span className="text-[15px] font-bold text-brand-text tracking-tight block leading-tight">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="text-[10px] text-brand-muted">{unreadCount} unread</span>
                            )}
                          </div>
                        </div>
                        {notifications.some(n => !n.readAt) && (
                          <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-brand-muted hover:text-emerald hover:bg-emerald/8 transition-all outline-none focus:outline-none"
                          >
                            <i className="fa-solid fa-check-double text-[10px]" />
                            Mark all read
                          </button>
                        )}
                      </div>
                      {/* Filter tabs */}
                      <div className="relative flex items-center gap-1 bg-canvas rounded-lg p-0.5">
                        {["all", "unread"].map(f => (
                          <button
                            key={f}
                            onClick={() => setNotifFilter(f)}
                            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all outline-none focus:outline-none ${
                              notifFilter === f
                                ? "bg-surface text-brand-text shadow-sm"
                                : "text-brand-muted hover:text-brand-text"
                            }`}
                          >
                            {f === "unread" && unreadCount > 0 ? (
                              <span className="flex items-center justify-center gap-1.5">
                                Unread
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-brand-danger/90 text-white leading-none">{unreadCount}</span>
                              </span>
                            ) : f.charAt(0).toUpperCase() + f.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E7EB transparent" }}>
                      {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <div className="relative mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald/5 border border-emerald/10 flex items-center justify-center">
                              <i className="fa-regular fa-bell-slash text-brand-muted text-xl" />
                            </div>
                            {notifFilter === "unread" && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald flex items-center justify-center">
                                <i className="fa-solid fa-check text-white text-[8px]" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-bold text-brand-text mb-1">
                            {notifFilter === "unread" ? "You're all caught up!" : "No notifications yet"}
                          </p>
                          <p className="text-xs text-brand-muted leading-relaxed max-w-[200px]">
                            {notifFilter === "unread" ? "No unread alerts right now." : "Alerts will appear here as they arrive."}
                          </p>
                        </div>
                      ) : (
                        <div className="px-2 py-2 space-y-0.5">
                          {todayItems.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest px-3 pt-1 pb-1.5">Today</p>
                              {todayItems.map((n, i) => <NotifItem key={n._id} n={n} i={i} />)}
                            </>
                          )}
                          {earlierItems.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest px-3 pt-2 pb-1.5">Earlier</p>
                              {earlierItems.map((n, i) => <NotifItem key={n._id} n={n} i={i + todayItems.length} />)}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-brand-border/40 px-4 py-3">
                      <NavLink
                        to="/dashboard/reports/notification-logs"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-brand-muted hover:text-emerald transition-colors no-underline"
                      >
                        View all notifications
                        <i className="fa-solid fa-arrow-right text-[10px]" />
                      </NavLink>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-brand-border hover:border-emerald/40 hover:bg-emerald/5 transition-all outline-none focus:outline-none"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="w-7 h-7 rounded-full bg-emerald flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-brand-text hidden sm:block max-w-[280px]">
                {user?.name || "User"}
              </span>
              <i className="fa-solid fa-chevron-down text-[10px] text-brand-muted"></i>
            </motion.button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full right-0 mt-1 bg-surface border border-brand-border rounded-xl shadow-floating z-50 overflow-hidden origin-top-right min-w-full w-max"
                >
                  <div className="px-4 py-3 border-b border-brand-border">
                    <p className="text-sm font-semibold text-brand-text">{user?.name || "User"}</p>
                    <p className="text-xs text-brand-muted truncate mt-0.5">{user?.email || ""}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-brand-danger hover:bg-brand-danger/5 transition-colors outline-none focus:outline-none border-0 bg-transparent"
                  >
                    <i className="fa-solid fa-sign-out text-xs"></i>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          </div>{/* end right wrapper */}
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6">
          <Suspense fallback={<SectionLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {!isSuperAdmin && (
        <ChatWidget />
      )}
    </div>
  );
}
