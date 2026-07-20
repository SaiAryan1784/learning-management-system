import { useState } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toastr from "toastr";
import { Button } from "../components/ui";
import AuthLayout from "../components/ui/AuthLayout";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-colors";

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-brand-text mb-1">
      {children}
      {required && <span className="text-brand-danger ml-1">*</span>}
    </label>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const requestOtp = async () => {
    if (!form.email) {
      toastr.error("Enter your email");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/password/reset/request", { email: form.email });
      toastr.success("If the email exists, an OTP has been sent");
      setStep(2);
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!form.otp || !form.newPassword || !form.confirmPassword) {
      toastr.error("Please fill all fields");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toastr.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/password/reset/confirm", {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      toastr.success("Password reset successful! Please sign in.");
      navigate("/login");
    } catch (err) {
      toastr.error(err.response?.data?.error || "Password reset failed");
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            {step === 1 ? "Reset password" : "Set a new password"}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {step === 1
              ? "Enter your account email to receive a reset code"
              : "Enter the code sent to your email and choose a new password"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <div>
                <FieldLabel required>Email</FieldLabel>
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                  className={inputClass}
                />
              </div>
              <Button variant="primary" size="lg" fullWidth loading={loading} onClick={requestOtp}>
                {loading ? "Sending…" : "Send reset code"}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              <div>
                <FieldLabel required>Reset code</FieldLabel>
                <input
                  type="text"
                  name="otp"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={form.otp}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className="text-xs text-brand-muted mt-0.5">Sent to {form.email}</p>
              </div>

              <div>
                <FieldLabel required>New password</FieldLabel>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="newPassword"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={form.newPassword}
                    onChange={handleChange}
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

              <div>
                <FieldLabel required>Confirm new password</FieldLabel>
                <input
                  type={showPwd ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && resetPassword()}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={resetPassword}
                >
                  {loading ? "Resetting…" : "Reset password"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm text-brand-muted text-center mt-5">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald hover:text-emerald-hover transition-colors no-underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
