import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const orgId = localStorage.getItem("organizationId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (orgId) {
    config.headers["x-organization-id"] = orgId;
  }

  return config;
});

// ✅ RESPONSE INTERCEPTOR (VERY IMPORTANT 🔥)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 && window.location.pathname !== "/login") {
      console.warn("Session expired. Logging out...");

      // Clear all auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("organizationId");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("remember");

      // No blocking alert() — a jarring interruption for a background/expired-token 401.
      // Redirect to login (skipped if already there, e.g. a failed login attempt).
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;