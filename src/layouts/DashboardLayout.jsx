import { Outlet, useNavigate,Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");   // go to landing
  };

  return (
    <div className="dash-cnt">
      <section className="sidebar">
        <div className="header">
          <a href="#">
           <img
          src="../src/images/lms-logo.png"
          className="brand-img"
          alt="Brand Logo"
        />
          </a>
        </div>

        <div className="separator-wrapper">
          <hr className="separator" />
          <label className="minimize-btn">
            <input type="checkbox" id="minimize" />
            <i className="fa-solid fa-angle-left"></i>
          </label>
        </div>

        <div className="navigation">
          <div className="section main-section">
            <ul className="items">
              <li className="item">
                <a href="#">
                  <i className="fa-solid fa-house"></i>
                  <span className="item-text">Dashboard</span>
                  <span className="item-tooltip">Dashboard</span>
                </a>
              </li>
              <li className="item">
                <a href="#">
                  <i className="fa-solid fa-user"></i>
                  <span className="item-text">Account</span>
                  <span className="item-tooltip">Account</span>
                </a>
              </li>
              <li className="item">
                <a href="#">
                  <i className="fa-solid fa-file"></i>
                  <span className="item-text">Posts</span>
                  <span className="item-tooltip">Posts</span>
                </a>
              </li>
              <li className="item">
                <a href="#">
                  <i className="fa-solid fa-calendar"></i>
                  <span className="item-text">Schedules</span>
                  <span className="item-tooltip">Schedules</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <div className="main-data">
        <div className="main-hdr">
          <div className="mx-wd">
            <div className="hdr-wp">
              <div className="hdr-md">
                <div className="nv-menus">
                  <span className="nav-link" onClick={handleLogout}>Logout <i className="fa-solid fa-sign-out"></i></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
