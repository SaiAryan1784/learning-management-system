import { useState } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import toastr from "toastr";
import AOS from "aos";
import "aos/dist/aos.css";
export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = full form
  const [loading, setLoading] = useState(false);
AOS.init({
  duration: 800,
  once: true,
});
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

  // ================= SEND OTP =================
  const sendOtp = async () => {
    if (!form.email) {
      toastr.error("Enter email", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/signup/request-otp", {
        email: form.email,
      });

      toastr.success("OTP sent to email!", "success");
      setStep(2); // go to next step
    } catch (err) {
      console.error(err);
      toastr.error(err.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY + REGISTER =================
  const verifyAndRegister = async () => {
    if (!form.otp || !form.organizationName || !form.ownerName || !form.password) {
      toastr.error("Fill all fields", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/signup/verify-otp", {
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
    <div className="lg-mn">
      <video autoPlay muted loop playsInline>
        <source src="/src/images/rl-bnr.mp4" type="video/mp4" />
      </video>
      <div className="mx-wd">
      <div className="sc-wp">
        <div className="sc-in">
          <div className="login-container" data-aos="fade-up">
          <img
          src="../src/images/lms-logo.png"
          className="brand-img"
          alt="Brand Logo"
        />

          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <>
              <input
                className="login-ip"
                type="email"
                placeholder="Enter Email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
              <button className="snd-btn" onClick={sendOtp} disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {/* STEP 2: FULL FORM */}
          {step === 2 && (
            <>
              <input
                className="login-ip"
                type="text"
                placeholder="Enter OTP"
                name="otp"
                value={form.otp}
                onChange={handleChange}
              />
              <input
                className="login-ip"
                type="text"
                placeholder="Organization Name"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
              />
              <input
                className="login-ip"
                type="text"
                placeholder="Owner Name"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
              />
              <input
                className="login-ip"
                type="password"
                placeholder="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
              <button className="snd-btn" onClick={verifyAndRegister} disabled={loading}>
                {loading ? "Creating..." : "Register"}
              </button>
            </>
          )}

          <p className="reg-tx">
            Already have an account? <Link className="nv-lnk" to="/login">Login</Link>
          </p>
        </div>
          
        {/* <h1 className="main-tl">LEARNING OPTS</h1>
        <p className="main-tx">Empower Learning Anytime, Anywhere</p> */}
      </div>
      <div className="sc-in">
        
      </div>
    </div>
    </div>
    </div>
  );
}
