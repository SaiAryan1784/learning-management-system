import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Required for the httpOnly refresh cookie to travel with /auth/refresh and
  // /auth/logout. www.learningopts.com and api.learningopts.com share a registrable
  // domain, so the SameSite=Lax cookie is sent on these XHRs.
  withCredentials: true,
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

/* ── Silent refresh ────────────────────────────────────────────────────────────
 * Access tokens are short-lived (15 min). A 401 means "get a new access token",
 * not "the session is over" — the session lives in the refresh cookie. Only a
 * failed refresh ends it.
 *
 * Refreshes are single-flight: N requests that 401 at once trigger one /auth/refresh
 * and all wait on the same promise, then retry.
 * ──────────────────────────────────────────────────────────────────────────── */

let refreshPromise = null;
const AUTH_KEYS = [
  "accessToken",
  "lmsUser",
  "lmsPermissions",
  "lmsAccess",
  "organizationId",
  "adminSnapshot",
  "impersonating",
  "remember",
  "loginTime",
];

const isAuthEndpoint = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/logout");

/** Applies a fresh session payload from /auth/refresh to localStorage. */
function storeSession(data) {
  const token = data?.accessToken?.accessToken ?? data?.accessToken;
  if (token) localStorage.setItem("accessToken", token);

  if (data?.user) {
    localStorage.setItem(
      "lmsUser",
      JSON.stringify({ ...data.user, role: data.role })
    );
  }
  if (data?.role?.permissions) {
    localStorage.setItem("lmsPermissions", JSON.stringify(data.role.permissions));
  }
  if (data?.access) {
    localStorage.setItem("lmsAccess", JSON.stringify(data.access));
  }
  if (data?.accessTokenExpiresIn) {
    localStorage.setItem(
      "accessTokenExpiresAt",
      String(Date.now() + data.accessTokenExpiresIn * 1000)
    );
  }
  return token;
}

/**
 * Rotates the session. Retries once on REFRESH_RACE: two tabs can present the same
 * cookie, and the loser only needs to re-read the cookie the winner just set.
 */
export async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await api.post("/auth/refresh");
      return storeSession(res.data);
    } catch (err) {
      if (err.response?.data?.code === "REFRESH_RACE") {
        const res = await api.post("/auth/refresh");
        return storeSession(res.data);
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function endSession() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;

    // 403 (no permission) and 429 (rate limited) are not session problems — they
    // used to be treated as one, which ended sessions on a permission gap.
    if (status !== 401 || !original || isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    if (original._retried) {
      endSession();
      return Promise.reject(error);
    }

    try {
      const token = await refreshSession();
      original._retried = true;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      console.warn("Session could not be refreshed. Logging out.");
      endSession();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
