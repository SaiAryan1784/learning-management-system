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

import MyCourses from "./pages/dashboard/MyCourses";
import StaffLessonView from "./pages/staff/StaffLessonView";
import StaffDashboard from "./pages/staff/StaffDashboard";

import ManagerStaffDetails from "./pages/dashboard/ManagerStaffDetails";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";

import ProtectedRoute from "./components/ProtectedRoute";


// ================= SUPER ADMIN ROUTE =================
const SuperAdminRoute = ({ children }) => {
  const { user, isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return isSuperAdmin ? children : <Navigate to="/dashboard" replace />;
};


// ================= OWNER / MANAGER ROUTE =================
const OwnerRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user?.isPlatformAdmin === true) return children;
  if (role?.name === "Owner" || role?.name === "Admin") return children;

  return <Navigate to="/dashboard" replace />;
};


// ================= STAFF ROUTE =================
const StaffRoute = ({ children }) => {
  const { user, role, isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (role?.name !== "Owner" && role?.name !== "Admin") return children;

  return <Navigate to="/dashboard" replace />;
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

            {/* Default Dashboard */}
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

            {/* ================= OWNER / MANAGER ================= */}

            {/* Manager Dashboard */}
            <Route
              path="manager"
              element={
                <OwnerRoute>
                  <ManagerDashboard />
                </OwnerRoute>
              }
            />

            {/* Staff Progress Details */}
            <Route
              path="staff-progress/:staffId"
              element={
                <OwnerRoute>
                  <ManagerStaffDetails />
                </OwnerRoute>
              }
            />

            {/* Owner Staff List */}
            <Route
              path="staff"
              element={
                <OwnerRoute>
                  <OwnerStaff />
                </OwnerRoute>
              }
            />

            <Route
              path="locations"
              element={
                <OwnerRoute>
                  <OwnerLocations />
                </OwnerRoute>
              }
            />

            <Route
              path="roles"
              element={
                <OwnerRoute>
                  <OwnerRoles />
                </OwnerRoute>
              }
            />

            <Route
              path="course-categories"
              element={
                <OwnerRoute>
                  <CourseCategories />
                </OwnerRoute>
              }
            />

            <Route
              path="courses"
              element={
                <OwnerRoute>
                  <OSCourses />
                </OwnerRoute>
              }
            />

            <Route
              path="courses/:courseId/modules"
              element={
                <OwnerRoute>
                  <CourseModules />
                </OwnerRoute>
              }
            />

            <Route
              path="courses/:courseId/modules/:moduleId/lessons"
              element={
                <OwnerRoute>
                  <ModuleLessions />
                </OwnerRoute>
              }
            />

            <Route
              path="courses/:courseId/assign"
              element={
                <OwnerRoute>
                  <CourseAssignStaff />
                </OwnerRoute>
              }
            />

            {/* ================= STAFF ================= */}

            {/* Staff Personal Dashboard */}
            <Route
              path="my-dashboard"
              element={
                <StaffRoute>
                  <StaffDashboard />
                </StaffRoute>
              }
            />

            {/* Staff Lesson View */}
            <Route
              path="staff/course/:courseId/lesson/:lessonId"
              element={
                <StaffRoute>
                  <StaffLessonView />
                </StaffRoute>
              }
            />

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}