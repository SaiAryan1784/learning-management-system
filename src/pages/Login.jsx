import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import toastr from "toastr";
import { Button, Input } from "../components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

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

      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      console.error("Login failed:", err);
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
    <div className="min-h-screen flex items-center justify-center bg-charcoal relative overflow-hidden">
      <style>{`
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0px, 0px); }
          33%       { transform: translate(40px, -60px); }
          66%       { transform: translate(-30px, 30px); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0px, 0px); }
          40%       { transform: translate(-50px, 40px); }
          70%       { transform: translate(30px, -30px); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0px, 0px); }
          50%       { transform: translate(20px, 50px); }
        }
      `}</style>

      {/* Background orbs */}
      <div style={{ position:"fixed", top:"-15%", left:"-10%", width:"550px", height:"550px", borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)", filter:"blur(48px)", animation:"orb-drift-1 28s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-20%", right:"-8%", width:"650px", height:"650px", borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)", filter:"blur(64px)", animation:"orb-drift-2 35s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"fixed", top:"30%", right:"5%", width:"380px", height:"380px", borderRadius:"50%", background:"radial-gradient(circle, rgba(44,44,46,0.9) 0%, transparent 70%)", filter:"blur(56px)", animation:"orb-drift-3 22s ease-in-out infinite", pointerEvents:"none" }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4 bg-surface rounded-3xl border border-brand-border shadow-floating overflow-hidden"
      >
        {/* Top accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald to-emerald-hover" />

        <div className="px-10 py-10">
          {/* Logo + heading */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-10"
          >
            <img
              src="/images/lms.png"
              className="w-32 mx-auto mb-6 block"
              alt="Brand Logo"
            />
            <h1 className="text-2xl font-bold text-brand-text tracking-tight">Welcome back</h1>
            <p className="text-sm text-brand-muted mt-2">Sign in to continue your learning journey</p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
            }}
            className="space-y-4"
          >
            {/* Email */}
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<i className="fa-regular fa-envelope" />}
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <Input
                id="login-password"
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                leadingIcon={<i className="fa-solid fa-lock" />}
                trailingIcon={
                  <button
                    type="button"
                    className="text-brand-muted hover:text-charcoal transition-colors p-1"
                    onClick={() => setShowPwd((s) => !s)}
                    tabIndex={-1}
                  >
                    <i className={`fa-regular fa-eye${showPwd ? "-slash" : ""}`} />
                  </button>
                }
              />
            </motion.div>

            {/* Sign in button */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="pt-2"
            >
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.35 }}
            className="text-sm text-brand-muted mt-8 text-center"
          >
            Don&apos;t have an account?{" "}
            <Link
              className="text-emerald font-semibold hover:text-emerald-hover transition-colors no-underline"
              to="/register"
            >
              Register
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
