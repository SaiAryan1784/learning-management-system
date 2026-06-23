import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/api";
import toastr from "toastr";
import { Button } from "../components/ui";
import AuthLayout from "../components/ui/AuthLayout";

const inputClass =
  "w-full px-4 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-colors";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const staffId = params.get("staffId") || "";
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!staffId) {
      toastr.error("Invalid invite link");
      return;
    }
    if (!otp.trim()) {
      toastr.error("Enter the OTP from your invite email");
      return;
    }
    if (password.length < 8) {
      toastr.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toastr.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await api.post("/staff/accept-invite", { staffId, otp: otp.trim(), password });
      toastr.success("Account created — please sign in");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Could not accept invite");
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
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-text tracking-tight">Accept your invite</h1>
          <p className="text-sm text-brand-muted mt-2">
            Set a password to finish creating your account.
          </p>
        </div>

        <div className="space-y-5">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">Email</label>
            <input type="email" value={email} readOnly className={`${inputClass} bg-canvas cursor-not-allowed`} />
          </div>

          {/* OTP */}
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">Invite code (OTP)</label>
            <input
              type="text"
              placeholder="Enter the code from your email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1.5">Confirm password</label>
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAccept()}
              className={inputClass}
            />
          </div>

          <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleAccept}>
            {loading ? "Creating account…" : "Accept invite"}
          </Button>
        </div>

        <p className="text-sm text-brand-muted text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-emerald hover:text-emerald-hover transition-colors no-underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
