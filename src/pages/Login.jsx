import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import toastr from "toastr";
import { Button, Input, FormField } from "../components/ui";

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

      <div
        style={{
          position: "fixed", top: "-15%", left: "-10%",
          width: "550px", height: "550px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)",
          filter: "blur(48px)",
          animation: "orb-drift-1 28s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "-20%", right: "-8%",
          width: "650px", height: "650px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)",
          filter: "blur(64px)",
          animation: "orb-drift-2 35s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed", top: "30%", right: "5%",
          width: "380px", height: "380px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(44,44,46,0.9) 0%, transparent 70%)",
          filter: "blur(56px)",
          animation: "orb-drift-3 22s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm mx-4 bg-surface rounded-2xl border border-brand-border p-8 shadow-floating"
      >
        <motion.img
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          src="/images/lms.png"
          className="w-40 mx-auto mb-2 block"
          alt="Brand Logo"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="text-center mb-6"
        >
          <h1 className="text-heading text-brand-text">Welcome back</h1>
          <p className="text-caption text-brand-muted mt-1">Sign in to continue your learning.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
          }}
          className="space-y-3"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <FormField label="Email" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<i className="fa-regular fa-envelope text-xs" />}
              />
            </FormField>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <FormField label="Password" htmlFor="login-password">
              <Input
                id="login-password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                leadingIcon={<i className="fa-solid fa-lock text-xs" />}
                trailingIcon={
                  <button
                    type="button"
                    className="text-brand-muted hover:text-charcoal transition-colors"
                    onClick={() => setShowPwd((s) => !s)}
                    tabIndex={-1}
                  >
                    <i className={`fa-regular fa-eye${showPwd ? "-slash" : ""} text-xs`} />
                  </button>
                }
              />
            </FormField>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="pt-2"
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleLogin}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </motion.div>
        </motion.div>

        <p className="text-brand-muted text-caption mt-5 text-center">
          Don&apos;t have an account?{" "}
          <Link
            className="text-emerald font-semibold hover:text-emerald-hover transition-colors no-underline"
            to="/register"
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
