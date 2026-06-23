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
  const [remember, setRemember] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toastr.error("Please enter email and password");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password, remember });

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
        <div className="mb-6">
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
              onClick={() => toastr.info("Password reset — coming soon")}
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

        </motion.div>

        {/* Footer */}
        <p className="text-sm text-brand-muted text-center mt-6">
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
