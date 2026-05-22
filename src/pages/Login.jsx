import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import toastr from "toastr";
import AOS from "aos";
import "aos/dist/aos.css";

const inputClass =
  "w-full px-3 py-2.5 mb-3 border border-brand-border rounded-lg bg-white text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-shadow";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

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
      }, 800);
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

        <input
          className={inputClass}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className={inputClass}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          className="w-full bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-brand-muted text-xs mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link
            className="text-emerald font-semibold hover:text-emerald-hover transition-colors"
            to="/register"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
