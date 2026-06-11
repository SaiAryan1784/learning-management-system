import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import toastr from "toastr";
import { Button, Input } from "../components/ui";
import AuthLayout from "../components/ui/AuthLayout";

const inputClass =
  "w-full px-4 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-colors";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toastr.error("Please enter email and password");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });

      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      if (res.data?.organizationId) {
        localStorage.setItem("organizationId", res.data.organizationId);
      }
      localStorage.setItem("loginTime", Date.now());

      login(res.data);
      toastr.success("Login successful!");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      if (err.response?.status === 401) {
        toastr.warning("Invalid email or password");
      } else {
        toastr.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-0"
      >
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-brand-muted mt-2">
            Please enter your details to sign in
          </p>
        </div>

        {/* Form fields */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          }}
          className="space-y-5"
        >
          {/* Email */}
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors border-0 bg-transparent outline-none"
              >
                <i className={`fa-regular fa-eye${showPwd ? "-slash" : ""} text-sm`} />
              </button>
            </div>
          </motion.div>

          {/* Remember + Forgot */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="flex items-center justify-between"
          >
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-brand-border accent-emerald cursor-pointer"
              />
              <span className="text-sm text-brand-muted">Remember for 30 days</span>
            </label>
            <button
              type="button"
              className="text-sm font-semibold text-emerald hover:text-emerald-hover transition-colors bg-transparent border-0 outline-none cursor-pointer"
            >
              Forgot password?
            </button>
          </motion.div>

          {/* Sign In */}
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleLogin}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </motion.div>

          {/* Google sign-in */}
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <button
              type="button"
              onClick={() => toastr.info("Google sign-in coming soon")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-brand-border rounded-lg bg-white text-sm font-semibold text-brand-text hover:bg-canvas transition-colors"
            >
              {/* Google SVG icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <p className="text-sm text-brand-muted text-center mt-8">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-emerald hover:text-emerald-hover transition-colors no-underline"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
