import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import useIdleLogout from "./pages/UserIdleLogout";
import { PageLoader } from "./components/ui/Spinner";
import ProtectedRoute from "./components/ProtectedRoute";

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
const Admin                 = lazy(() => import("./pages/Admin"));

/* ── Layout ───────────────────────────────────────────── */
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));

/* ── Dashboard / Owner ────────────────────────────────── */
const Modules           = lazy(() => import("./pages/dashboard/Modules"));
const OwnerLocations    = lazy(() => import("./pages/dashboard/OwnerLocations"));
const OwnerRoles        = lazy(() => import("./pages/dashboard/OwnerRoles"));
const OwnerStaff        = lazy(() => import("./pages/dashboard/OwnerStaff"));
const OSCourses         = lazy(() => import("./pages/dashboard/OSCourses"));
const CourseAdd         = lazy(() => import("./pages/dashboard/CourseAdd"));
const CourseCategories  = lazy(() => import("./pages/dashboard/CourseCategories"));
const CourseModules     = lazy(() => import("./pages/dashboard/CourseModules"));
const ModuleLessions    = lazy(() => import("./pages/dashboard/ModuleLessions"));
const CourseAssignStaff = lazy(() => import("./pages/dashboard/CourseAssignStaff"));
const ManagerDashboard  = lazy(() => import("./pages/dashboard/ManagerDashboard"));
const ManagerStaffDetails = lazy(() => import("./pages/dashboard/ManagerStaffDetails"));

/* ── Staff ────────────────────────────────────────────── */
const StaffDashboard    = lazy(() => import("./pages/staff/StaffDashboard"));
const StaffLessonView   = lazy(() => import("./pages/staff/StaffLessonView"));
const CourseAssessments = lazy(() => import("./pages/staff/CourseAssessments"));
const AssessmentAttempt = lazy(() => import("./pages/staff/AssessmentAttempt"));
const StaffCertificates = lazy(() => import("./pages/staff/StaffCertificates"));

/* ── Assessments ──────────────────────────────────────── */
const OSAssessment = lazy(() => import("./pages/assessments/OSAssessment"));

/* ── Compliance ───────────────────────────────────────── */
const ComplianceSettings = lazy(() => import("./pages/compliance/ComplianceSettings"));
const CompliancePolicies = lazy(() => import("./pages/compliance/CompliancePolicies"));
const RunAssignments     = lazy(() => import("./pages/compliance/RunAssignments"));

/* ── Reports ──────────────────────────────────────────── */
const ComplianceOverview     = lazy(() => import("./pages/reports/ComplianceOverview"));
const StaffComplianceReports = lazy(() => import("./pages/reports/StaffComplianceReports"));
const AuditTrail             = lazy(() => import("./pages/reports/AuditTrail"));
const NotificationLogs       = lazy(() => import("./pages/reports/NotificationLogs"));
const CertificateExpiry      = lazy(() => import("./pages/reports/CertificateExpiry"));

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
  const { logout } = useAuth();

  useIdleLogout(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");
    alert("Session expired due to inactivity");
    logout();
    window.location.href = "/login";
  });

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public */}
        <Route path="/"                        element={<Landing />} />
        <Route path="/login"                   element={<Login />} />
        <Route path="/register"                element={<Register />} />
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

          {/* Manager */}
          <Route path="manager"                  element={<PermissionRoute><ManagerDashboard /></PermissionRoute>} />
          <Route path="staff-progress/:staffId"  element={<PermissionRoute><ManagerStaffDetails /></PermissionRoute>} />

          {/* Owner / admin */}
          <Route path="staff"            element={<PermissionRoute><OwnerStaff /></PermissionRoute>} />
          <Route path="certificates"     element={<PermissionRoute><StaffCertificates /></PermissionRoute>} />
          <Route path="locations"        element={<PermissionRoute><OwnerLocations /></PermissionRoute>} />
          <Route path="roles"            element={<PermissionRoute><OwnerRoles /></PermissionRoute>} />

          <Route path="course-categories"        element={<PermissionRoute><CourseCategories /></PermissionRoute>} />
          <Route path="courses"                  element={<PermissionRoute><OSCourses /></PermissionRoute>} />
          <Route path="course-add/:courseId?"    element={<PermissionRoute><CourseAdd /></PermissionRoute>} />
          <Route path="assessments"              element={<PermissionRoute><OSAssessment /></PermissionRoute>} />

          <Route path="courses/:courseId/modules"                          element={<PermissionRoute><CourseModules /></PermissionRoute>} />
          <Route path="courses/:courseId/modules/:moduleId/lessons"        element={<PermissionRoute><ModuleLessions /></PermissionRoute>} />
          <Route path="courses/:courseId/assign"                           element={<PermissionRoute><CourseAssignStaff /></PermissionRoute>} />

          {/* Staff */}
          <Route path="my-dashboard"                                        element={<PermissionRoute><StaffDashboard /></PermissionRoute>} />
          <Route path="staff/course/:courseId/lesson/:lessonId"            element={<PermissionRoute><StaffLessonView /></PermissionRoute>} />
          <Route path="staff/course/:courseId/assessments"                 element={<PermissionRoute><CourseAssessments /></PermissionRoute>} />
          <Route path="staff/assessment/:assessmentId/:courseId"           element={<PermissionRoute><AssessmentAttempt /></PermissionRoute>} />

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
        </Route>

      </Routes>
    </Suspense>
  );
}

/* ── Root ─────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
