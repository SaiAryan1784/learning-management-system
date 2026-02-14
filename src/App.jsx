import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Modules from "./pages/dashboard/Modules";
import LocationsView from "./pages/dashboard/LocationsView";
import OwnerLocations from "./pages/dashboard/OwnerLocations";
import OwnerRoles from "./pages/dashboard/OwnerRoles"; // NEW
import OwnerStaff from "./pages/dashboard/OwnerStaff";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import OSCourses from "./pages/dashboard/OSCourses";
import CourseCategories from "./pages/dashboard/CourseCategories";
import CourseModules from "./pages/dashboard/CourseModules";
import ModuleLessions from "./pages/dashboard/ModuleLessions";
import CourseAssignStaff from "./pages/dashboard/CourseAssignStaff";
import MyCourses from "./pages/dashboard/MyCourses";
// 🔥 Super Admin Route Wrapper
const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? children : <Landing />;
};

// 🔥 Owner Route Wrapper
const OwnerRoute = ({ children }) => {
  const { isSuperAdmin } = useAuth();
  return !isSuperAdmin ? children : <Landing />; // Only non-superadmin (owner)
};
// 🔥 Staff Route Wrapper
const StaffRoute = ({ children }) => {
  const { user, isSuperAdmin } = useAuth();
  if (!user) return <Landing />; // not logged in
  if (isSuperAdmin) return <Landing />; // superadmin sees dashboard
  if (user.role?.name !== "Owner" && user.role?.name !== "Admin") {
    // anything else is staff
    return children;
  }
  return <Landing />;
};


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/my-courses" element={<MyCourses />} />

          {/* Dashboard Wrapper */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Default dashboard page */}
            <Route index element={<Admin />} />

            {/* 🔥 Super Admin */}
            <Route
              path="modules"
              element={
                <SuperAdminRoute>
                  <Modules />
                </SuperAdminRoute>
              }
            />

            {/* 🔥 Owner + Staff pages INSIDE dashboard */}
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
              path="staff"
              element={
                <OwnerRoute>
                  <OwnerStaff />
                </OwnerRoute>
              }
            />
            <Route path="course-categories" element={<OwnerRoute><CourseCategories /></OwnerRoute>} />
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
            <Route
              path="courses"
              element={
                <OwnerRoute>
                  <OSCourses />
                </OwnerRoute>
              }
            />
          </Route>

          {/* Super Admin standalone view */}
          <Route
            path="/locations-view"
            element={
              <ProtectedRoute>
                <SuperAdminRoute>
                  <LocationsView />
                </SuperAdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

