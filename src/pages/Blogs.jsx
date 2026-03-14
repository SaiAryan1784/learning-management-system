import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Blogs() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const blogPosts = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600",
      title: "The Future of Online Learning in 2026",
      desc: "Discover how AI and immersive technologies are reshaping the classroom experience.",
      date: "March 10, 2026",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
      title: "10 Tips for Effective Remote Studying",
      desc: "Master your schedule and environment to boost productivity while learning from home.",
      date: "March 05, 2026",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
      title: "Why Certification Matters in Tech",
      desc: "A deep dive into how industry-recognized badges can accelerate your career path.",
      date: "Feb 28, 2026",
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
                  <img src="/images/lms.png" className="nv-img" alt="Brand Logo" />
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        {/* Page Title */}
        <div className="page-title light-background">
          <div className="container d-lg-flex justify-content-between align-items-center">
            <h1 className="mb-2 mb-lg-0">Insights & Articles</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Blogs</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Blog Section */}
        <section className="section blog-section">
          <div className="container">
            <div className="row g-4">
              {blogPosts.map((post) => (
                <div className="col-lg-4 col-md-6" key={post.id} data-aos="fade-up">
                  <div className="blog-card h-100 shadow-sm border-0">
                    <div className="blog-img-box">
                      <img src={post.image} alt={post.title} className="card-img-top" />
                      <span className="blog-date">{post.date}</span>
                    </div>
                    <div className="card-body p-4">
                      <h3 className="card-title h5 fw-bold">{post.title}</h3>
                      <p className="card-text text-muted">{post.desc}</p>
                      <Link to={`/blog/${post.id}`} className="read-more-btn">
                        Read More <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="footer position-relative">
        <div className="container-fluid footer-top">
          <div className="row">
            <div className="col-lg-12 col-md-12 text-center">
              <Link to="/" className="logo d-flex align-items-center justify-content-center">
                <img src="/images/lms.png" className="nv-img" alt="Learning Opts Logo" />
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
                <Link to="#"><i className="bi bi-twitter-x"></i></Link>
                <Link to="#"><i className="bi bi-facebook"></i></Link>
                <Link to="#"><i className="bi bi-instagram"></i></Link>
                <Link to="#"><i className="bi bi-linkedin"></i></Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid copyright text-center mt-4">
          <p>© <span>Copyright</span> <strong className="px-1 sitename">Learning Opts</strong> <span>All Rights Reserved</span></p>
          <div className="credits">Designed by Learning Opts</div>
        </div>
      </footer>
    </>
  );
}