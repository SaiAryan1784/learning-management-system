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

/**
 * Does this viewer satisfy a page's requirement?
 *
 * `required` is null (any authenticated user), a permission string, or an
 * array meaning "any one of these". The array form exists because some pages
 * serve two different jobs: the course catalogue is reachable by authors
 * (courses:create) and by people who only assign training (courses:assign),
 * but must NOT be reachable by a learner who merely holds courses:read.
 */
export function can(hasPermission, required) {
  if (required === null || required === undefined) return true;
  if (Array.isArray(required)) return required.some((p) => hasPermission(p));
  return hasPermission(required);
}

/** Permission required by each page, keyed by page concept. */
export const PERM = Object.freeze({
  managerDashboard: "reports:read",
  // Reading someone else's progress, not your own — the API gates the team
  // views on reports:read for the same reason: every learner holds
  // progress:read for their own record.
  staffProgress: "reports:read",

  staffRead: "staff:read",
  staffCreate: "staff:create",
  locationsRead: "locations:read",
  locationsCreate: "locations:create",
  locationsUpdate: "locations:update",
  locationsDelete: "locations:delete",
  rolesRead: "roles:read",
  rolesCreate: "roles:create",

  coursesRead: "courses:read",
  coursesCreate: "courses:create",
  coursesAssign: "courses:assign",
  coursesPublish: "courses:publish",
  lessonsRead: "lessons:read",
  lessonsCreate: "lessons:create",
  lessonsUpdate: "lessons:update",

  certificatesManage: "certificates:issue",
  // Seeing other people's certificates is seeing those people. Every learner
  // holds certificates:read for their OWN record, so the team view is gated on
  // staff:read — the API requires both (backend certificate.routes.ts).
  certificatesTeam: "staff:read",
  certificatesRevoke: "certificates:revoke",
  coursesUpdate: "courses:update",
  settingsRead: "settings:read",
  settingsUpdate: "settings:update",
  complianceRun: "compliance:run",

  reportsRead: "reports:read",
  auditRead: "audit-logs:read",
});

/**
 * The course catalogue is an authoring and assignment screen, not a learner
 * screen. Every role including Staff holds courses:read (they need it to read
 * their assigned material), so gating the catalogue on that would show a
 * learner the New Course, Delete and Assign controls.
 */
export const COURSE_ADMIN = Object.freeze([PERM.coursesCreate, PERM.coursesAssign]);

/**
 * Authoring screens — the lesson list with its Add Lesson / Add Guide / reorder
 * / delete controls, the path-courses editor, the course form. These are gated
 * on CREATE, not read: a Franchise Owner holds lessons:read (needed to take
 * the training) and reaching these pages showed them a wall of controls that
 * all 403. Every button that leads here must check the same constant, so the
 * catalogue reads PERM.authoring too.
 */
export const AUTHORING = PERM.coursesCreate;

/**
 * Sidebar structure for every non-platform-admin user.
 *
 * `permission: null` means any authenticated user — used for the pages that
 * serve the viewer their own data (their dashboard, their assigned courses,
 * their certificates and badges). Those must never be permission-gated: a
 * learner with no administrative permissions still owns their own training.
 *
 * `altLabel: { unless: <permission>, label }` relabels an item for viewers who
 * lack `unless` — the page is shared by two audiences (e.g. authors vs.
 * everyone else) and the sidebar should say which one the viewer is getting.
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
      // Non-authors get a paths-only version of this page, so the link says so.
      { label: "Courses", icon: "fa-book-open", path: "/dashboard/courses", permission: COURSE_ADMIN, altLabel: { unless: AUTHORING, label: "Paths" } },
      // Gated on create rather than read: the Roles page has no per-action
      // gating yet, so offering it to a read-only role would show controls
      // that 403. Owners and Admins are the only ones meant to shape roles.
      { label: "Roles", icon: "fa-user-shield", path: "/dashboard/roles", permission: PERM.rolesCreate },
    ],
  },
  {
    label: "Recognition",
    items: [
      { label: "Recognition", icon: "fa-award", path: "/dashboard/certificates", permission: null },
      // Franchise Owners and Managers get the same page read-only, under a name
      // that says what it is for them.
      { label: "Certificates Admin", icon: "fa-certificate", path: "/dashboard/certificates/manage", permission: PERM.certificatesTeam, altLabel: { unless: PERM.certificatesManage, label: "Team Certificates" } },
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

const allowed = (hasPermission) => (item) => can(hasPermission, item.permission);

/**
 * Filter the sidebar for one user. `hasPermission` comes from useAuth() and
 * already returns true for platform admins and for a role holding "*".
 */
export function visibleSections(hasPermission) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter(allowed(hasPermission))
      .map((item) =>
        item.altLabel && !can(hasPermission, item.altLabel.unless)
          ? { ...item, label: item.altLabel.label }
          : item,
      ),
  })).filter((section) => section.items.length > 0);
}

/**
 * What a viewer may do on the certificates page. It serves two audiences:
 * people who issue and design certificates, and location leaders who only need
 * to see and download their team's.
 */
export function certificateCapabilities(hasPermission) {
  return {
    canIssue: hasPermission(PERM.certificatesManage),
    canRevoke: hasPermission(PERM.certificatesRevoke),
    // "Edit design" saves the course or path itself.
    canEditDesigns: hasPermission(PERM.coursesUpdate),
    canDesignTemplate: hasPermission(PERM.settingsUpdate),
  };
}

/** Filter the reports group for one user. */
export function visibleReports(hasPermission) {
  return REPORTS_ITEMS.filter(allowed(hasPermission));
}
