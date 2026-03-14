import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";
import toastr from "toastr";
import AOS from "aos";
import "aos/dist/aos.css";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  AOS.init({
  duration: 800,
  once: true,
});
  const handleLogin = async () => {
    if (!email || !password) {
      toastr.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });

      login(res.data);

      toastr.success("Login successful!", "success");

      setTimeout(() => {
        navigate("/dashboard");
      }, 800); // let user see toast

    } catch (err) {
      console.error("Login failed:", err);

      if (err.response?.status === 401) {
        toastr.warning("Invalid email or password", "error");
      } else {
        toastr.warning("Something went wrong", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-mn">
      <video autoPlay muted loop playsInline>
        <source src="/images/rl-bnr.mp4" type="video/mp4" />
      </video>
      <div className="mx-wd">
      <div className="sc-wp">
        <div className="sc-in">
        {/* <h1 className="main-tl">LEARNING OPTS</h1>
        <p className="main-tx">Empower Learning Anytime, Anywhere</p> */}
        <div className="login-container" data-aos="fade-up">
        <img
          src="/images/lms.png"
          className="brand-img"
          alt="Brand Logo"
        />

        <input
          className="login-ip"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-ip"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="snd-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="reg-tx">
          Don't have an account?{" "}
          <Link className="nv-lnk" to="/register">
            Register
          </Link>
        </p>
      </div>
      </div>
      <div className="sc-in">
        
      </div>
      </div>
    </div>
    </div>
  );
}
