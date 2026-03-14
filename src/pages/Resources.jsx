import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Resources() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const resourceList = [
    {
      id: 1,
      type: "E-Book",
      title: "The 2026 Skill Gap Report",
      desc: "A comprehensive look at the most in-demand technical skills for the upcoming year.",
      format: "PDF (4.2 MB)",
      icon: "bi-file-earmark-pdf"
    },
    {
      id: 2,
      type: "Guide",
      title: "LMS Implementation Checklist",
      desc: "Everything you need to set up your corporate training environment smoothly.",
      format: "DOCX (1.1 MB)",
      icon: "bi-file-earmark-check"
    },
    {
      id: 3,
      type: "Template",
      title: "Course Curriculum Planner",
      desc: "Structure your learning modules effectively with our ready-to-use template.",
      format: "XLSX (850 KB)",
      icon: "bi-file-earmark-spreadsheet"
    },
    {
      id: 4,
      type: "Video",
      title: "Mastering the Dashboard",
      desc: "A visual walkthrough of the student and instructor interface features.",
      format: "MP4 (15 Min)",
      icon: "bi-play-circle"
    },
    {
      id: 5,
      type: "Case Study",
      title: "Scaling Tech Education",
      desc: "How a mid-size firm boosted productivity by 40% using Learning Opts.",
      format: "PDF (2.5 MB)",
      icon: "bi-journal-text"
    },
    {
      id: 6,
      type: "Infographic",
      title: "Learning Retention Stats",
      desc: "Visual data on how micro-learning improves long-term memory retention.",
      format: "PNG (5.0 MB)",
      icon: "bi-image"
    }
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
            <h1 className="mb-2 mb-lg-0">Learning Resource Library</h1>
            <nav className="breadcrumbs">
                <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Resources</li>
                </ol>
            </nav>
            </div>
        </div>
        {/* Resources Grid */}
        <section className="res-grd bg-light-gray pb-5">
          <div className="container">
            <div className="row g-4">
              {resourceList.map((res) => (
                <div className="col-lg-4 col-md-6" key={res.id} data-aos="fade-up">
                  <div className="resource-card shadow-sm border-0 h-100">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="res-icon-wrapper">
                          <i className={`bi ${res.icon}`}></i>
                        </div>
                        <span className="res-type-tag">{res.type}</span>
                      </div>
                      <h3 className="h5 fw-bold mb-2">{res.title}</h3>
                      <p className="text-muted small mb-4">{res.desc}</p>
                      <div className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top">
                        <span className="text-uppercase small fw-bold text-secondary">{res.format}</span>
                        <Link to="#" className="btn-download">
                          Download <i className="bi bi-download ms-2"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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