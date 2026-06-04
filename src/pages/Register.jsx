import { useState } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toastr from "toastr";
import { Button, Input, FormField } from "../components/ui";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
      toastr.error("Enter email", "error");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/signup/request-otp", { email: form.email });
      toastr.success("OTP sent to email!", "success");
      setStep(2);
    } catch (err) {
      console.error(err);
      toastr.error(err.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (!form.otp || !form.organizationName || !form.ownerName || !form.password) {
      toastr.error("Fill all fields", "error");
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
      toastr.success("Account created successfully! Please login.", "success");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toastr.error(err.response?.data?.message || "Registration failed", "error");
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
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4 bg-surface rounded-3xl border border-brand-border shadow-floating overflow-hidden"
      >
        {/* Top accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald to-emerald-hover" />

        <div className="px-10 py-10">
        <img
          src="/images/lms.png"
          className="w-40 mx-auto mb-2 block"
          alt="Brand Logo"
        />

        <div className="text-center mb-5">
          <h1 className="text-heading text-brand-text">Create your workspace</h1>
          <p className="text-caption text-brand-muted mt-1">
            {step === 1 ? "Step 1 of 2 — verify email" : "Step 2 of 2 — set up workspace"}
          </p>
        </div>

        <div className="h-1 bg-brand-border rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full bg-emerald rounded-full"
            initial={false}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <AnimatePresence mode="wait" custom={step}>
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <FormField label="Work Email" required>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  leadingIcon={<i className="fa-regular fa-envelope text-xs" />}
                />
              </FormField>
              <Button variant="primary" size="lg" fullWidth loading={loading} onClick={sendOtp}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <FormField label="OTP" hint={`Sent to ${form.email}`} required>
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="Organization Name" required>
                <Input
                  type="text"
                  placeholder="Acme Inc."
                  name="organizationName"
                  value={form.organizationName}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="Owner Name" required>
                <Input
                  type="text"
                  placeholder="Jane Doe"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="Password" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
              </FormField>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} fullWidth>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={verifyAndRegister}
                >
                  {loading ? "Creating..." : "Register"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-brand-muted text-caption mt-5 text-center">
          Already have an account?{" "}
          <Link
            className="text-emerald font-semibold hover:text-emerald-hover transition-colors no-underline"
            to="/login"
          >
            Login
          </Link>
        </p>
        </div>
      </motion.div>
    </div>
  );
}
