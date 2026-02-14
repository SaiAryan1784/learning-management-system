import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const orgId = localStorage.getItem("organizationId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 only owner will have this
  if (orgId) {
    config.headers["x-organization-id"] = orgId;
  }

  return config;
});

export default api;
