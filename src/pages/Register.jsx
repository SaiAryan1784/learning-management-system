import { useState } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import toastr from "toastr";
import AOS from "aos";
import "aos/dist/aos.css";

const inputClass =
  "w-full px-3 py-2.5 mb-3 border border-brand-border rounded-lg bg-white text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-shadow";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  AOS.init({ duration: 800, once: true });

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
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      >
        <source src="/images/rl-bnr.mp4" type="video/mp4" />
      </video>

      <div
        className="relative z-10 w-full max-w-sm mx-4 bg-surface rounded-2xl border border-brand-border p-8 shadow-card"
        data-aos="fade-up"
      >
        <img
          src="/images/lms.png"
          className="w-40 mx-auto mb-6 block"
          alt="Brand Logo"
        />

        {step === 1 && (
          <>
            <input
              className={inputClass}
              type="email"
              placeholder="Enter Email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            <button
              className="w-full bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              className={inputClass}
              type="text"
              placeholder="Enter OTP"
              name="otp"
              value={form.otp}
              onChange={handleChange}
            />
            <input
              className={inputClass}
              type="text"
              placeholder="Organization Name"
              name="organizationName"
              value={form.organizationName}
              onChange={handleChange}
            />
            <input
              className={inputClass}
              type="text"
              placeholder="Owner Name"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
            <button
              className="w-full bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={verifyAndRegister}
              disabled={loading}
            >
              {loading ? "Creating..." : "Register"}
            </button>
          </>
        )}

        <p className="text-brand-muted text-xs mt-4 text-center">
          Already have an account?{" "}
          <Link
            className="text-emerald font-semibold hover:text-emerald-hover transition-colors"
            to="/login"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
