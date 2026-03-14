import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
export default function HelpCenter() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const helpCategories = [
    {
      id: 1,
      icon: "bi-person-badge",
      title: "Account & Profile",
      desc: "Manage your password, profile settings, and account security.",
    },
    {
      id: 2,
      icon: "bi-book",
      title: "Courses & Learning",
      desc: "How to enroll, track progress, and access certificates.",
    },
    {
      id: 3,
      icon: "bi-credit-card",
      title: "Billing & Payments",
      desc: "Information about subscriptions, refunds, and invoices.",
    },
    {
      id: 4,
      icon: "bi-laptop",
      title: "Technical Support",
      desc: "Troubleshooting video playback, app issues, and browser compatibility.",
    },
    {
      id: 5,
      icon: "bi-shield-check",
      title: "Trust & Safety",
      desc: "Report content, learn about our policies, and stay safe.",
    },
    {
      id: 6,
      icon: "bi-question-circle",
      title: "FAQs",
      desc: "Common questions and quick answers for every learner.",
    },
  ];

  return (
    <>
      <header className="main-hdr">
        <div className="mx-wd">
          <nav id="navbar">
            <div className="nav-container">
              <div className="logo">
                <Link to="/">
                  <img src="/images/lms.png" className="nv-img" alt="Logo" />
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="page-title light-background">
            <div className="container d-lg-flex justify-content-between align-items-center">
            <h1 className="mb-2 mb-lg-0">Help Center</h1>
            <nav className="breadcrumbs">
                <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Help Center</li>
                </ol>
            </nav>
            </div>
        </div>
        {/* Categories Section */}
        <section className="section">
          <div className="container">
            <div className="row g-4">
              {helpCategories.map((item) => (
                <div className="col-lg-4 col-md-6" key={item.id} data-aos="fade-up">
                  <div className="help-card shadow-sm h-100">
                    <div className="help-icon">
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <Link to="#" className="btn-link stretched-link">View Articles</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Consistent with your other pages) */}
      <footer id="footer" className="footer position-relative">
        <div className="container-fluid footer-top">
          <div className="row">
            <div className="col-lg-12 text-center">
              <img src="/images/lms.png" className="nv-img" alt="Logo" />
              <div className="footer-contact pt-3">
                <p>Digital Learning Solutions</p>
                <p>Transforming Education Through Smart Learning Technology</p>
                <p><strong>Email:</strong> <span>support@learningopts.com</span></p>
              </div>
            </div>
          </div>
        </div>
        <div className="container-fluid copyright text-center mt-4">
          <p>© <span>Copyright</span> <strong className="px-1 sitename">Learning Opts</strong> All Rights Reserved</p>
        </div>
      </footer>
    </>
  );
}