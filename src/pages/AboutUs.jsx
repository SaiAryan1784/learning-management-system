import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

export default function AboutUs() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <>
      <header className="main-hdr">
        <div className="mx-wd">
          <nav id="navbar">
            <div className="nav-container">
              <div className="logo">
                <Link to="/">
                  <img src="/images/lms.png" className="nv-img" alt="Brand Logo" />
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        {/* Page Title / Hero Section */}
        <div className="page-title light-background">
          <div className="container d-lg-flex justify-content-between align-items-center">
            <h1 className="mb-2 mb-lg-0">About Learning Opts</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">About Us</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Mission Section */}
        <section className="section mission-section">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6" data-aos="fade-right">
                <h2 className="section-heading">Redefining the Future of Learning</h2>
                <p className="lead-text">
                  At Learning Opts, we believe that education should be accessible, 
                  engaging, and tailored to the modern digital era.
                </p>
                <p>
                  Our platform isn't just a repository of courses; it’s a dynamic 
                  ecosystem designed to foster growth, bridge skill gaps, and 
                  connect learners with world-class knowledge from anywhere in the world.
                </p>
                <div className="stats-grid">
                  <div className="stat-item">
                    <h3>15k+</h3>
                    <p>Active Students</p>
                  </div>
                  <div className="stat-item">
                    <h3>500+</h3>
                    <p>Expert Mentors</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6" data-aos="zoom-in">
                <div className="about-img-wrapper">
                   <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" alt="Team working" className="img-fluid rounded-4 shadow" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="section bg-light-gray">
          <div className="container section-title text-center" data-aos="fade-up">
            <h2>Why Choose Learning Opts?</h2>
            <p>Built by educators, for the next generation of professionals.</p>
          </div>

          <div className="container">
            <div className="row g-4">
              <div className="col-md-4" data-aos="fade-up" data-aos-delay="100">
                <div className="feature-card">
                  <div className="icon-box"><i className="bi bi-laptop"></i></div>
                  <h3>Flexible Learning</h3>
                  <p>Access your dashboard on any device, anytime. Learn at your own pace without pressure.</p>
                </div>
              </div>
              <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
                <div className="feature-card">
                  <div className="icon-box"><i className="bi bi-patch-check"></i></div>
                  <h3>Certified Courses</h3>
                  <p>Gain industry-recognized certifications that help you stand out in the competitive job market.</p>
                </div>
              </div>
              <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
                <div className="feature-card">
                  <div className="icon-box"><i className="bi bi-people"></i></div>
                  <h3>Community Driven</h3>
                  <p>Join forums and study groups to collaborate with peers and mentors globally.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    <footer id="footer" className="footer position-relative">
      <div className="container-fluid footer-top">
        <div className="row">
          <div className="col-lg-12 col-md-12 text-center">
            <Link href="" className="logo d-flex align-items-center justify-content-center">
              <img src="/images/lms.png" className="nv-img" alt="Learning Opts Logo"/> 
            </Link>
            <div className="footer-contact pt-3">
              <p>Digital Learning Solutions</p>
              <p>Transforming Education & Skill Development Through Smart, Scalable and Secure Learning Technology</p>
              <p className="mt-3">
                <strong>Phone:</strong> <span>+91 90000 00000</span>
              </p>
              <p>
                <strong>Email:</strong> <span>support@learningopts.com</span>
              </p>
            </div>
            <div className="social-links mt-3 d-flex align-items-center justify-content-center">
              <Link href="#"><i className="bi bi-twitter-x"></i></Link>
              <Link href="#"><i className="bi bi-facebook"></i></Link>
              <Link href="#"><i className="bi bi-instagram"></i></Link>
              <Link href="#"><i className="bi bi-linkedin"></i></Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid copyright text-center mt-4">
        <p>
          © <span>Copyright</span> 
          <strong className="px-1 sitename">Learning Opts</strong> 
          <span>All Rights Reserved</span>
        </p>
        <div className="credits">
          Designed by Learning Opts
        </div>
      </div>

    </footer>
    </>
  );
}