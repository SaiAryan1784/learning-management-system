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
      <nav className="sidebar">
        
        <div className="logo">
          <img src="/images/lms-logo.png" className="nv-img" alt="Brand Logo"/> 
        </div>

        <Link to="/dashboard" className="nav-item-full active">
            <i className="fa-solid fa-house"></i>
            <span>Dashboard</span>
        </Link>

        <div className="nav-grid">
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-building-user"></i>
                <span>Company Type</span>
            </Link>
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-user-tie"></i>
                <span>Candidate</span>
            </Link>
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-building"></i>
                <span>Company</span>
            </Link>
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-credit-card"></i>
                <span>Subscription</span>
            </Link>
             <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-box-archive"></i>
                <span>Package Plan</span>
            </Link>
        </div>

        <h3 className="menu-heading">MANAGE JOB</h3>

        <div className="nav-grid">
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-briefcase"></i>
                <span>Jobs</span>
            </Link>
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-users"></i>
                <span>Job Applicant</span>
            </Link>
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-list-check"></i>
                <span>Job Type</span>
            </Link>
            <Link to="/dashboard" className="nav-item-grid">
                <i className="fa-solid fa-tags"></i>
                <span>Job Category</span>
            </Link>
        </div>
    </nav>
      <div className="main-data">
        <div className="main-hdr">
          <div className="mx-wd">
            <div className="hdr-wp">
              <div className="hdr-md">
                <div className="nv-menus">
                  <span className="logout-btn" onClick={handleLogout}><i className="fa-solid fa-sign-out"></i></span>
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
