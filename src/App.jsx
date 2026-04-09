import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import useIdleLogout from "./pages/UserIdleLogout";

import Landing from "./pages/Landing";
import EmployeeLearningCloud from "./pages/EmployeeLearningCloud";
import AboutUs from "./pages/AboutUs";
import Blogs from "./pages/Blogs";
import HelpCenter from "./pages/HelpCenter";
import Resources from "./pages/Resources";
import ContactUs from "./pages/ContactUs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

import Modules from "./pages/dashboard/Modules";
import OwnerLocations from "./pages/dashboard/OwnerLocations";
import OwnerRoles from "./pages/dashboard/OwnerRoles";
import OwnerStaff from "./pages/dashboard/OwnerStaff";
import DashboardLayout from "./layouts/DashboardLayout";
import OSCourses from "./pages/dashboard/OSCourses";
import CourseAdd from "./pages/dashboard/CourseAdd";
import CourseCategories from "./pages/dashboard/CourseCategories";
import CourseModules from "./pages/dashboard/CourseModules";
import ModuleLessions from "./pages/dashboard/ModuleLessions";
import CourseAssignStaff from "./pages/dashboard/CourseAssignStaff";

import StaffLessonView from "./pages/staff/StaffLessonView";
import StaffDashboard from "./pages/staff/StaffDashboard";
import CourseAssessments from "./pages/staff/CourseAssessments";
import AssessmentAttempt from "./pages/staff/AssessmentAttempt";
import ManagerStaffDetails from "./pages/dashboard/ManagerStaffDetails";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import OSAssessment from "./pages/assessments/OSAssessment";
import StaffCertificates from "./pages/staff/StaffCertificates";
import ProtectedRoute from "./components/ProtectedRoute";

/* ================= PHASE 5 PAGES ================= */
import ComplianceSettings from "./pages/compliance/ComplianceSettings";
import CompliancePolicies from "./pages/compliance/CompliancePolicies";
import RunAssignments from "./pages/compliance/RunAssignments";

import ComplianceOverview from "./pages/reports/ComplianceOverview";
import StaffComplianceReports from "./pages/reports/StaffComplianceReports";
import AuditTrail from "./pages/reports/AuditTrail";
import NotificationLogs from "./pages/reports/NotificationLogs";
import CertificateExpiry from "./pages/reports/CertificateExpiry";

/* ================= ROLE BASED ROUTE ================= */
const PermissionRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const roleName = user?.role?.name?.trim().toLowerCase();
  const isSuperAdmin = user?.isPlatformAdmin === true;

  const isOwnerAdmin =
    !isSuperAdmin && (roleName === "admin" || roleName === "owner");

  const isStaff =
    !isSuperAdmin && roleName !== "admin" && roleName !== "owner";

  if (isSuperAdmin) return children;
  if (isOwnerAdmin) return children;

  if (isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/* ================= SUPER ADMIN ONLY ================= */
const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return user?.isPlatformAdmin === true
    ? children
    : <Navigate to="/dashboard" replace />;
};

/* ================= MAIN CONTENT WITH IDLE LOGOUT ================= */
function AppContent() {
  const { logout } = useAuth();

  // ✅ Idle Logout Hook
  useIdleLogout(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");

    alert("Session expired due to inactivity");

    logout(); // optional (if your context has logout logic)
    window.location.href = "/login";
  });

  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/employee-learning-cloud" element={<EmployeeLearningCloud />} />

      {/* ================= DASHBOARD ================= */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Admin />} />

        {/* SUPER ADMIN */}
        <Route
          path="modules"
          element={
            <SuperAdminRoute>
              <Modules />
            </SuperAdminRoute>
          }
        />

        {/* ROLE BASED */}
        <Route path="manager" element={<PermissionRoute><ManagerDashboard /></PermissionRoute>} />
        <Route path="staff-progress/:staffId" element={<PermissionRoute><ManagerStaffDetails /></PermissionRoute>} />

        <Route path="staff" element={<PermissionRoute><OwnerStaff /></PermissionRoute>} />
        <Route path="certificates" element={<PermissionRoute><StaffCertificates /></PermissionRoute>} />
        <Route path="locations" element={<PermissionRoute><OwnerLocations /></PermissionRoute>} />
        <Route path="roles" element={<PermissionRoute><OwnerRoles /></PermissionRoute>} />

        <Route path="course-categories" element={<PermissionRoute><CourseCategories /></PermissionRoute>} />
        <Route path="courses" element={<PermissionRoute><OSCourses /></PermissionRoute>} />
        <Route path="course-add/:courseId?" element={<PermissionRoute><CourseAdd /></PermissionRoute>} />
        <Route path="assessments" element={<PermissionRoute><OSAssessment /></PermissionRoute>} />

        <Route path="courses/:courseId/modules" element={<PermissionRoute><CourseModules /></PermissionRoute>} />
        <Route path="courses/:courseId/modules/:moduleId/lessons" element={<PermissionRoute><ModuleLessions /></PermissionRoute>} />
        <Route path="courses/:courseId/assign" element={<PermissionRoute><CourseAssignStaff /></PermissionRoute>} />

        {/* STAFF */}
        <Route path="my-dashboard" element={<PermissionRoute><StaffDashboard /></PermissionRoute>} />
        <Route path="staff/course/:courseId/lesson/:lessonId" element={<PermissionRoute><StaffLessonView /></PermissionRoute>} />
        <Route path="staff/course/:courseId/assessments" element={<PermissionRoute><CourseAssessments /></PermissionRoute>} />
        <Route path="staff/assessment/:assessmentId/:courseId" element={<PermissionRoute><AssessmentAttempt /></PermissionRoute>} />

        {/* COMPLIANCE */}
        <Route path="compliance/settings" element={<PermissionRoute><ComplianceSettings /></PermissionRoute>} />
        <Route path="compliance/policies" element={<PermissionRoute><CompliancePolicies /></PermissionRoute>} />
        <Route path="compliance/run-assignments" element={<PermissionRoute><RunAssignments /></PermissionRoute>} />

        {/* REPORTS */}
        <Route path="reports/compliance" element={<PermissionRoute><ComplianceOverview /></PermissionRoute>} />
        <Route path="reports/staff-compliance" element={<PermissionRoute><StaffComplianceReports /></PermissionRoute>} />
        <Route path="reports/audit-trail" element={<PermissionRoute><AuditTrail /></PermissionRoute>} />
        <Route path="reports/notification-logs" element={<PermissionRoute><NotificationLogs /></PermissionRoute>} />
        <Route path="reports/certificate-expiry" element={<PermissionRoute><CertificateExpiry /></PermissionRoute>} />
      </Route>

    </Routes>
  );
}

/* ================= ROOT APP ================= */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent /> {/* ✅ Idle logout active here */}
      </BrowserRouter>
    </AuthProvider>
  );
}