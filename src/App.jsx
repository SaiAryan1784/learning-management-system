import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import useIdleLogout from "./pages/UserIdleLogout";
import { PageLoader } from "./components/ui/Spinner";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
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
const PermissionRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const roleName = user?.role?.name?.trim().toLowerCase();
  const isSuperAdmin = user?.isPlatformAdmin === true;
  const isOwnerAdmin = !isSuperAdmin && (roleName === "admin" || roleName === "owner");
  const isStaff = !isSuperAdmin && roleName !== "admin" && roleName !== "owner";

  if (isSuperAdmin || isOwnerAdmin) return children;
  if (isStaff) return <Navigate to="/dashboard" replace />;
  return children;
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

          {/* Manager */}
          <Route path="manager"                  element={<PermissionRoute><ManagerDashboard /></PermissionRoute>} />
          <Route path="staff-progress/:staffId"  element={<PermissionRoute><ManagerStaffDetails /></PermissionRoute>} />

          {/* Owner / admin */}
          <Route path="staff"            element={<PermissionRoute><OwnerStaff /></PermissionRoute>} />
          <Route path="certificates"     element={<PermissionRoute><Recognition /></PermissionRoute>} />
          <Route path="certificates/manage" element={<PermissionRoute><CertificateManager /></PermissionRoute>} />
          <Route path="certificates/setup"  element={<PermissionRoute><CertificateSetup /></PermissionRoute>} />
          <Route path="badges"           element={<Navigate to="/dashboard/certificates" replace />} />
          <Route path="badges/manage"    element={<PermissionRoute><BadgeManager /></PermissionRoute>} />
          <Route path="locations"        element={<PermissionRoute><OwnerLocations /></PermissionRoute>} />
          <Route path="roles"            element={<PermissionRoute><OwnerRoles /></PermissionRoute>} />

          <Route path="courses"                  element={<PermissionRoute><OSCourses /></PermissionRoute>} />
          <Route path="courses/drafts"           element={<PermissionRoute><CourseDrafts /></PermissionRoute>} />
          <Route path="course-add/:courseId?"    element={<PermissionRoute><CourseAdd /></PermissionRoute>} />

          <Route path="courses/:courseId/lessons"                  element={<PermissionRoute><CourseLessons /></PermissionRoute>} />
          <Route path="courses/:courseId/lessons/new"              element={<PermissionRoute><LessonBuilder /></PermissionRoute>} />
          <Route path="courses/:courseId/lessons/:lessonId/edit"   element={<PermissionRoute><LessonBuilder /></PermissionRoute>} />
          <Route path="courses/:courseId/assign"                   element={<PermissionRoute><CourseAssignStaff /></PermissionRoute>} />

          {/* Staff */}
          <Route path="my-dashboard"                                        element={<PermissionRoute><StaffDashboard /></PermissionRoute>} />
          <Route path="staff/course/:courseId/lesson/:lessonId"            element={<PermissionRoute><StaffLessonView /></PermissionRoute>} />

          {/* Compliance */}
          <Route path="compliance/settings"       element={<PermissionRoute><ComplianceSettings /></PermissionRoute>} />
          <Route path="compliance/policies"       element={<PermissionRoute><CompliancePolicies /></PermissionRoute>} />
          <Route path="compliance/run-assignments" element={<PermissionRoute><RunAssignments /></PermissionRoute>} />

          {/* Reports */}
          <Route path="reports/compliance"         element={<PermissionRoute><ComplianceOverview /></PermissionRoute>} />
          <Route path="reports/staff-compliance"   element={<PermissionRoute><StaffComplianceReports /></PermissionRoute>} />
          <Route path="reports/audit-trail"        element={<PermissionRoute><AuditTrail /></PermissionRoute>} />
          <Route path="reports/notification-logs"  element={<PermissionRoute><NotificationLogs /></PermissionRoute>} />
          <Route path="reports/certificate-expiry" element={<PermissionRoute><CertificateExpiry /></PermissionRoute>} />

          {/* Settings */}
          <Route path="settings" element={<PermissionRoute><BrandSettings /></PermissionRoute>} />
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
