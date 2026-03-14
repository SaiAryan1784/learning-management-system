import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

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
// import CertificateExpiryReport from "./pages/reports/CertificateExpiryReport";
// import NotificationLogs from "./pages/reports/NotificationLogs";
// import AuditTrail from "./pages/reports/AuditTrail";


// ================= PERMISSION ROUTE =================
const PermissionRoute = ({ permission, children }) => {
  const { user, access, loading, hasPermission } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isSuperAdmin = user?.isPlatformAdmin === true;
  const isOwnerAdmin = !isSuperAdmin && access?.orgWide === true;
  const isStaff = !isSuperAdmin && access?.orgWide !== true;

  // Super Admin → full access
  if (isSuperAdmin) return children;

  // Owner/Admin → org wide access
  if (isOwnerAdmin) return children;

  // Staff → permission required
  if (isStaff && permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


// ================= SUPER ADMIN ONLY =================
const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return user?.isPlatformAdmin === true
    ? children
    : <Navigate to="/dashboard" replace />;
};


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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

            {/* ================= SUPER ADMIN ================= */}

            <Route
              path="modules"
              element={
                <SuperAdminRoute>
                  <Modules />
                </SuperAdminRoute>
              }
            />

            {/* ================= MANAGER DASHBOARD ================= */}

            <Route
              path="manager"
              element={
                <PermissionRoute permission="reports:read">
                  <ManagerDashboard />
                </PermissionRoute>
              }
            />

            <Route
              path="staff-progress/:staffId"
              element={
                <PermissionRoute permission="progress:read">
                  <ManagerStaffDetails />
                </PermissionRoute>
              }
            />

            {/* ================= STAFF MANAGEMENT ================= */}

            <Route
              path="staff"
              element={
                <PermissionRoute permission="staff:read">
                  <OwnerStaff />
                </PermissionRoute>
              }
            />

            <Route
              path="certificates"
              element={
                <PermissionRoute permission="certificates:read">
                  <StaffCertificates />
                </PermissionRoute>
              }
            />

            <Route
              path="locations"
              element={
                <PermissionRoute permission="locations:read">
                  <OwnerLocations />
                </PermissionRoute>
              }
            />

            <Route
              path="roles"
              element={
                <PermissionRoute permission="roles:read">
                  <OwnerRoles />
                </PermissionRoute>
              }
            />

            {/* ================= COURSES ================= */}

            <Route
              path="course-categories"
              element={
                <PermissionRoute permission="course-categories:read">
                  <CourseCategories />
                </PermissionRoute>
              }
            />

            <Route
              path="courses"
              element={
                <PermissionRoute permission="courses:read">
                  <OSCourses />
                </PermissionRoute>
              }
            />

            <Route
              path="assessments"
              element={
                <PermissionRoute permission="assessments:read">
                  <OSAssessment />
                </PermissionRoute>
              }
            />

            <Route
              path="courses/:courseId/modules"
              element={
                <PermissionRoute permission="course-modules:read">
                  <CourseModules />
                </PermissionRoute>
              }
            />

            <Route
              path="courses/:courseId/modules/:moduleId/lessons"
              element={
                <PermissionRoute permission="lessons:read">
                  <ModuleLessions />
                </PermissionRoute>
              }
            />

            <Route
              path="courses/:courseId/assign"
              element={
                <PermissionRoute permission="courses:assign">
                  <CourseAssignStaff />
                </PermissionRoute>
              }
            />

            {/* ================= STAFF DASHBOARD ================= */}

            <Route
              path="my-dashboard"
              element={
                <PermissionRoute permission="progress:read">
                  <StaffDashboard />
                </PermissionRoute>
              }
            />

            <Route
              path="staff/course/:courseId/lesson/:lessonId"
              element={
                <PermissionRoute permission="lessons:read">
                  <StaffLessonView />
                </PermissionRoute>
              }
            />

            <Route
              path="staff/course/:courseId/assessments"
              element={
                <PermissionRoute permission="progress:read">
                  <CourseAssessments />
                </PermissionRoute>
              }
            />

            <Route
              path="/dashboard/staff/assessment/:assessmentId/:courseId"
              element={
                <PermissionRoute permission="progress:read">
                  <AssessmentAttempt />
                </PermissionRoute>
              }
            />

            {/* ================= PHASE 5 : COMPLIANCE ================= */}

            <Route
              path="compliance/settings"
              element={
                <PermissionRoute permission="settings:read">
                  <ComplianceSettings />
                </PermissionRoute>
              }
            />

             <Route
              path="compliance/policies"
              element={
                <PermissionRoute permission="settings:read">
                  <CompliancePolicies />
                </PermissionRoute>
              }
            />

            <Route
              path="compliance/run-assignments"
              element={
                <PermissionRoute permission="settings:update">
                  <RunAssignments />
                </PermissionRoute>
              }
            />

            <Route
              path="reports/compliance"
              element={
                <PermissionRoute permission="reports:read">
                  <ComplianceOverview />
                </PermissionRoute>
              }
            />

            <Route
              path="reports/staff-compliance"
              element={
                <PermissionRoute permission="reports:read">
                  <StaffComplianceReports />
                </PermissionRoute>
              }
            />

           {/* <Route
              path="reports/certificates-expiry"
              element={
                <PermissionRoute permission="reports:read">
                  <CertificateExpiryReport />
                </PermissionRoute>
              }
            />

            <Route
              path="reports/notification-logs"
              element={
                <PermissionRoute permission="reports:read">
                  <NotificationLogs />
                </PermissionRoute>
              }
            />

            <Route
              path="reports/audit-trail"
              element={
                <PermissionRoute permission="reports:read">
                  <AuditTrail />
                </PermissionRoute>
              }
            /> */}

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}