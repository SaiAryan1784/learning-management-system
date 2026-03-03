import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import Landing from "./pages/Landing";
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

            {/* OWNER / ADMIN (ORG-WIDE) + STAFF (PERMISSION BASED) */}

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
          
            {/* STAFF DASHBOARD */}

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
          </Route>
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}