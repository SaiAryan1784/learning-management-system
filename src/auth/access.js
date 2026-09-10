/**
 * Single source of truth for who may see what.
 *
 * Both the router (App.jsx) and the sidebar (DashboardLayout.jsx) read this
 * file. They previously each decided access on their own and disagreed: the
 * sidebar offered Locations/Staff/Courses to every non-admin role while the
 * router bounced those roles straight back to the dashboard, which is what
 * produced the "screen flashes back to the dashboard" report.
 *
 * Permission strings must match backend/src/config/rolePresets.ts exactly — a
 * typo produces a silent lockout, not an error.
 */

/** Permission required by each page, keyed by page concept. */
export const PERM = Object.freeze({
  managerDashboard: "reports:read",
  staffProgress: "progress:read",

  staffRead: "staff:read",
  locationsRead: "locations:read",
  rolesRead: "roles:read",

  coursesRead: "courses:read",
  coursesCreate: "courses:create",
  coursesAssign: "courses:assign",
  coursesPublish: "courses:publish",
  lessonsRead: "lessons:read",
  lessonsCreate: "lessons:create",
  lessonsUpdate: "lessons:update",

  certificatesManage: "certificates:issue",
  settingsRead: "settings:read",
  settingsUpdate: "settings:update",
  complianceRun: "compliance:run",

  reportsRead: "reports:read",
  auditRead: "audit-logs:read",
});

/**
 * Sidebar structure for every non-platform-admin user.
 *
 * `permission: null` means any authenticated user — used for the pages that
 * serve the viewer their own data (their dashboard, their assigned courses,
 * their certificates and badges). Those must never be permission-gated: a
 * learner with no administrative permissions still owns their own training.
 */
export const NAV_SECTIONS = Object.freeze([
  {
    label: null,
    items: [
      { label: "Dashboard", icon: "fa-house", path: "/dashboard", permission: null, end: true },
      { label: "My Learning", icon: "fa-graduation-cap", path: "/dashboard/my-dashboard", permission: null },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Locations", icon: "fa-location-dot", path: "/dashboard/locations", permission: PERM.locationsRead },
      { label: "Staff", icon: "fa-users", path: "/dashboard/staff", permission: PERM.staffRead },
      { label: "Courses", icon: "fa-book-open", path: "/dashboard/courses", permission: PERM.coursesRead },
    ],
  },
  {
    label: "Recognition",
    items: [
      { label: "Recognition", icon: "fa-award", path: "/dashboard/certificates", permission: null },
      { label: "Certificates Admin", icon: "fa-certificate", path: "/dashboard/certificates/manage", permission: PERM.certificatesManage },
      { label: "Certificate Design", icon: "fa-pen-ruler", path: "/dashboard/certificates/setup", permission: PERM.settingsUpdate },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Compliance Settings", icon: "fa-sliders", path: "/dashboard/compliance/settings", permission: PERM.settingsRead },
      { label: "Policies", icon: "fa-shield-halved", path: "/dashboard/compliance/policies", permission: PERM.settingsRead },
      { label: "Run Assignments", icon: "fa-rotate", path: "/dashboard/compliance/run-assignments", permission: PERM.complianceRun },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", icon: "fa-gear", path: "/dashboard/settings", permission: PERM.settingsUpdate },
    ],
  },
]);

/** Reports live in their own collapsible group in the sidebar. */
export const REPORTS_ITEMS = Object.freeze([
  { label: "Compliance Overview", icon: "fa-chart-line", path: "/dashboard/reports/compliance", permission: PERM.reportsRead },
  { label: "Staff Compliance", icon: "fa-user-check", path: "/dashboard/reports/staff-compliance", permission: PERM.reportsRead },
  { label: "Certificate Expiry", icon: "fa-clock", path: "/dashboard/reports/certificate-expiry", permission: PERM.reportsRead },
  { label: "Notification Logs", icon: "fa-bell", path: "/dashboard/reports/notification-logs", permission: PERM.reportsRead },
  { label: "Audit Trail", icon: "fa-list", path: "/dashboard/reports/audit-trail", permission: PERM.auditRead },
]);

const allowed = (hasPermission) => (item) =>
  item.permission === null || hasPermission(item.permission);

/**
 * Filter the sidebar for one user. `hasPermission` comes from useAuth() and
 * already returns true for platform admins and for a role holding "*".
 */
export function visibleSections(hasPermission) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(allowed(hasPermission)),
  })).filter((section) => section.items.length > 0);
}

/** Filter the reports group for one user. */
export function visibleReports(hasPermission) {
  return REPORTS_ITEMS.filter(allowed(hasPermission));
}
