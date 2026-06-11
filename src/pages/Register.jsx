import { useState } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toastr from "toastr";
import { Button } from "../components/ui";
import AuthLayout from "../components/ui/AuthLayout";

const inputClass =
  "w-full px-4 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-colors";

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-brand-text mb-1.5">
      {children}
      {required && <span className="text-brand-danger ml-1">*</span>}
    </label>
  );
}

const STEPS = [
  { n: 1, label: "Email" },
  { n: 2, label: "Verify" },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                s.n < current
                  ? "bg-emerald border-emerald text-white"
                  : s.n === current
                  ? "border-emerald text-emerald bg-white"
                  : "border-brand-border text-brand-muted bg-white"
              }`}
            >
              {s.n < current ? (
                <i className="fa-solid fa-check text-[10px]" />
              ) : (
                s.n
              )}
            </div>
            <span
              className={`text-[10px] font-semibold mt-1 uppercase tracking-wide ${
                s.n <= current ? "text-emerald" : "text-brand-muted"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-16 mx-2 mb-5 rounded-full transition-colors ${
                current > s.n ? "bg-emerald" : "bg-brand-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    email: "",
    otp: "",
    organizationName: "",
    ownerName: "",
    password: "",
    timezone: "America/New_York",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendOtp = async () => {
    if (!form.email) {
      toastr.error("Enter email");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/signup/request-otp", { email: form.email });
      toastr.success("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (!form.otp || !form.organizationName || !form.ownerName || !form.password) {
      toastr.error("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/signup/verify-otp", {
        email: form.email,
        otp: form.otp,
        organizationName: form.organizationName,
        ownerName: form.ownerName,
        password: form.password,
        timezone: form.timezone,
      });
      toastr.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Registration failed");
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
        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-text tracking-tight">
            {step === 1 ? "Create an account" : "Set up workspace"}
          </h1>
          <p className="text-sm text-brand-muted mt-2">
            {step === 1
              ? "Enter your work email to get started"
              : `Verify your email and set up your organisation`}
          </p>
        </div>

        {/* Steps */}
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
                <FieldLabel required>Work Email</FieldLabel>
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  className={inputClass}
                />
              </div>
              <Button variant="primary" size="lg" fullWidth loading={loading} onClick={sendOtp}>
                {loading ? "Sending OTP…" : "Continue"}
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
              className="space-y-4"
            >
              <div>
                <FieldLabel required>OTP</FieldLabel>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter the code sent to your email"
                  value={form.otp}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className="text-xs text-brand-muted mt-1">Sent to {form.email}</p>
              </div>

              <div>
                <FieldLabel required>Organisation Name</FieldLabel>
                <input
                  type="text"
                  name="organizationName"
                  placeholder="Acme Inc."
                  value={form.organizationName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>Your Name</FieldLabel>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="Jane Doe"
                  value={form.ownerName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>Password</FieldLabel>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
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

              <div className="flex gap-3 pt-1">
                <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={verifyAndRegister}
                >
                  {loading ? "Creating…" : "Create account"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-sm text-brand-muted text-center mt-8">
          Already have an account?{" "}
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
