import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { PERM, COURSE_ADMIN, can } from "./auth/access";
import useIdleLogout from "./pages/UserIdleLogout";
import { PageLoader } from "./components/ui/Spinner";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import NewVersionBanner from "./components/NewVersionBanner";
import { Toaster } from "sonner";

/* ── Public pages ─────────────────────────────────────── */
const Landing               = lazy(() => import("./pages/Landing"));
const EmployeeLearningCloud = lazy(() => import("./pages/EmployeeLearningCloud"));
const AboutUs               = lazy(() => import("./pages/AboutUs"));
const Blogs                 = lazy(() => import("./pages/Blogs"));
const HelpCenter            = lazy(() => import("./pages/HelpCenter"));
const Resources             = lazy(() => import("./pages/Resources"));
const ContactUs             = lazy(() => import("./pages/ContactUs"));
const Login                 = lazy(() => import("./pages/Login"));
const Register              = lazy(() => import("./pages/Register"));
const ForgotPassword         = lazy(() => import("./pages/ForgotPassword"));
const AcceptInvite          = lazy(() => import("./pages/AcceptInvite"));
const Admin                 = lazy(() => import("./pages/Admin"));

/* ── Layout (eager — shell must never lazy-load) ──────── */
import DashboardLayout from "./layouts/DashboardLayout";

/* ── Dashboard / Owner ────────────────────────────────── */
const CreateClientOrg   = lazy(() => import("./pages/dashboard/CreateClientOrg"));
const Modules           = lazy(() => import("./pages/dashboard/Modules"));
const OwnerLocations    = lazy(() => import("./pages/dashboard/OwnerLocations"));
const OwnerRoles        = lazy(() => import("./pages/dashboard/OwnerRoles"));
const OwnerStaff        = lazy(() => import("./pages/dashboard/OwnerStaff"));
const OSCourses         = lazy(() => import("./pages/dashboard/OSCourses"));
const CourseDrafts      = lazy(() => import("./pages/dashboard/CourseDrafts"));
const CourseAdd         = lazy(() => import("./pages/dashboard/CourseAdd"));
const CourseLessons     = lazy(() => import("./pages/dashboard/CourseLessons"));
const LessonBuilder     = lazy(() => import("./pages/dashboard/LessonBuilder"));
const CourseAssignStaff = lazy(() => import("./pages/dashboard/CourseAssignStaff"));
const PathCourses       = lazy(() => import("./pages/dashboard/PathCourses"));
const PathAssignStaff   = lazy(() => import("./pages/dashboard/PathAssignStaff"));
const BadgeManager      = lazy(() => import("./pages/dashboard/BadgeManager"));
const CertificateManager = lazy(() => import("./pages/dashboard/CertificateManager"));
const CertificateSetup   = lazy(() => import("./pages/dashboard/CertificateSetup"));
const ManagerDashboard  = lazy(() => import("./pages/dashboard/ManagerDashboard"));
const ManagerStaffDetails = lazy(() => import("./pages/dashboard/ManagerStaffDetails"));

/* ── Staff ────────────────────────────────────────────── */
const StaffDashboard    = lazy(() => import("./pages/staff/StaffDashboard"));
const StaffLessonView   = lazy(() => import("./pages/staff/StaffLessonView"));
const Recognition       = lazy(() => import("./pages/staff/Recognition"));

/* ── Compliance ───────────────────────────────────────── */
const ComplianceSettings = lazy(() => import("./pages/compliance/ComplianceSettings"));
const CompliancePolicies = lazy(() => import("./pages/compliance/CompliancePolicies"));
const RunAssignments     = lazy(() => import("./pages/compliance/RunAssignments"));

/* ── Settings ────────────────────────────────────────── */
const BrandSettings = lazy(() => import("./pages/dashboard/BrandSettings"));

/* ── Reports ──────────────────────────────────────────── */
const ComplianceOverview     = lazy(() => import("./pages/reports/ComplianceOverview"));
const StaffComplianceReports = lazy(() => import("./pages/reports/StaffComplianceReports"));
const AuditTrail             = lazy(() => import("./pages/reports/AuditTrail"));
const NotificationLogs       = lazy(() => import("./pages/reports/NotificationLogs"));
const CertificateExpiry      = lazy(() => import("./pages/reports/CertificateExpiry"));

/* ── Root redirect ────────────────────────────────────── */
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

/* ── Route guards ─────────────────────────────────────── */

/**
 * The app's only permission guard.
 *
 * No `permission` prop means "any authenticated user" — that is the correct
 * gate for the pages that serve viewers their own data. hasPermission()
 * already returns true for platform admins and for a role holding "*", so
 * neither needs special-casing here.
 *
 * This used to branch on whether the role was named "admin" or "owner", which
 * locked every Manager and Provider out of the whole application, their own
 * learning pages included.
 */
const Guard = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return can(hasPermission, permission) ? children : <Navigate to="/dashboard" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return user?.isPlatformAdmin === true ? children : <Navigate to="/dashboard" replace />;
};

/* ── App content ──────────────────────────────────────── */
function AppContent() {
  const { logout, remembered } = useAuth();

  useIdleLogout(() => {
    localStorage.removeItem("loginTime");
    alert("Session expired due to inactivity");
    logout();
    window.location.href = "/login";
  }, remembered);

  return (
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public */}
        <Route path="/"                        element={<RootRoute />} />
        <Route path="/login"                   element={<Login />} />
        <Route path="/register"                element={<Register />} />
        <Route path="/forgot-password"         element={<ForgotPassword />} />
        <Route path="/accept-invite"           element={<AcceptInvite />} />
        <Route path="/about-us"                element={<AboutUs />} />
        <Route path="/blogs"                   element={<Blogs />} />
        <Route path="/help-center"             element={<HelpCenter />} />
        <Route path="/resources"               element={<Resources />} />
        <Route path="/contact-us"              element={<ContactUs />} />
        <Route path="/employee-learning-cloud" element={<EmployeeLearningCloud />} />

        {/* Dashboard shell */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Admin />} />

          {/* Super admin */}
          <Route path="modules" element={<SuperAdminRoute><Modules /></SuperAdminRoute>} />
          <Route path="organizations/new" element={<SuperAdminRoute><CreateClientOrg /></SuperAdminRoute>} />

          {/* The viewer's own learning — never permission-gated */}
          <Route path="my-dashboard"                            element={<Guard><StaffDashboard /></Guard>} />
          <Route path="staff/course/:courseId/lesson/:lessonId" element={<Guard><StaffLessonView /></Guard>} />
          <Route path="certificates"                            element={<Guard><Recognition /></Guard>} />

          {/* Team oversight */}
          <Route path="manager"                 element={<Guard permission={PERM.managerDashboard}><ManagerDashboard /></Guard>} />
          <Route path="staff-progress/:staffId" element={<Guard permission={PERM.staffProgress}><ManagerStaffDetails /></Guard>} />

          {/* Org management */}
          <Route path="staff"     element={<Guard permission={PERM.staffRead}><OwnerStaff /></Guard>} />
          <Route path="locations" element={<Guard permission={PERM.locationsRead}><OwnerLocations /></Guard>} />
          <Route path="roles"     element={<Guard permission={PERM.rolesRead}><OwnerRoles /></Guard>} />

          {/* Recognition administration */}
          <Route path="certificates/manage" element={<Guard permission={PERM.certificatesManage}><CertificateManager /></Guard>} />
          <Route path="certificates/setup"  element={<Guard permission={PERM.settingsUpdate}><CertificateSetup /></Guard>} />
          <Route path="badges"              element={<Navigate to="/dashboard/certificates" replace />} />
          <Route path="badges/manage"       element={<Guard permission={PERM.settingsUpdate}><BadgeManager /></Guard>} />

          {/* Course authoring */}
          <Route path="courses"               element={<Guard permission={COURSE_ADMIN}><OSCourses /></Guard>} />
          <Route path="courses/drafts"        element={<Guard permission={PERM.coursesCreate}><CourseDrafts /></Guard>} />
          <Route path="course-add/:courseId?" element={<Guard permission={PERM.coursesCreate}><CourseAdd /></Guard>} />

          <Route path="courses/:courseId/lessons"                element={<Guard permission={PERM.lessonsRead}><CourseLessons /></Guard>} />
          <Route path="courses/:courseId/lessons/new"            element={<Guard permission={PERM.lessonsCreate}><LessonBuilder /></Guard>} />
          <Route path="courses/:courseId/lessons/:lessonId/edit" element={<Guard permission={PERM.lessonsUpdate}><LessonBuilder /></Guard>} />

          {/* Guides — same two components, scoped to a guide instead of the course.
              URLs stay on /paths/ so existing links keep working. */}
          <Route path="courses/:courseId/paths/:pathId/lessons"     element={<Guard permission={PERM.lessonsRead}><CourseLessons /></Guard>} />
          <Route path="courses/:courseId/paths/:pathId/lessons/new" element={<Guard permission={PERM.lessonsCreate}><LessonBuilder /></Guard>} />
          <Route path="courses/:courseId/assign"                    element={<Guard permission={PERM.coursesAssign}><CourseAssignStaff /></Guard>} />

          {/* Paths — org-level groups of courses */}
          <Route path="paths/:pathId/courses" element={<Guard permission={PERM.coursesRead}><PathCourses /></Guard>} />
          <Route path="paths/:pathId/assign"  element={<Guard permission={PERM.coursesAssign}><PathAssignStaff /></Guard>} />

          {/* Compliance */}
          <Route path="compliance/settings"        element={<Guard permission={PERM.settingsRead}><ComplianceSettings /></Guard>} />
          <Route path="compliance/policies"        element={<Guard permission={PERM.settingsRead}><CompliancePolicies /></Guard>} />
          <Route path="compliance/run-assignments" element={<Guard permission={PERM.complianceRun}><RunAssignments /></Guard>} />

          {/* Reports */}
          <Route path="reports/compliance"         element={<Guard permission={PERM.reportsRead}><ComplianceOverview /></Guard>} />
          <Route path="reports/staff-compliance"   element={<Guard permission={PERM.reportsRead}><StaffComplianceReports /></Guard>} />
          <Route path="reports/audit-trail"        element={<Guard permission={PERM.auditRead}><AuditTrail /></Guard>} />
          <Route path="reports/notification-logs"  element={<Guard permission={PERM.reportsRead}><NotificationLogs /></Guard>} />
          <Route path="reports/certificate-expiry" element={<Guard permission={PERM.reportsRead}><CertificateExpiry /></Guard>} />

          {/* Settings */}
          <Route path="settings" element={<Guard permission={PERM.settingsUpdate}><BrandSettings /></Guard>} />
        </Route>

      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}

/* ── Root ─────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      {/* Outside the router on purpose — a stale bundle is a property of the
          tab, not of whatever page happens to be open. */}
      <NewVersionBanner />
      <Toaster
        position="top-right"
        duration={3500}
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "inherit",
            fontSize: "13px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
          },
        }}
      />
    </AuthProvider>
  );
}
