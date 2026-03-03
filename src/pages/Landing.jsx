
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const [activeIndex, setActiveIndex] = useState(null);
    const toggleFAQ = (index) => {
      setActiveIndex(activeIndex === index ? null : index);
    };
    const navigate = useNavigate();
    const handleLogout = () => {
    logout();
    navigate("/");
    };
    AOS.init({
      duration: 800,
      loop: true,
    });
  return (
    <>
    <header className="main-hdr">
        <div className="mx-wd">
            <nav id="navbar">
                <div className="nav-container">
                    <div className="logo"><img
                            src="/images/lms-logo.png"
                            className="nv-img"
                            alt="Brand Logo"
                            /> </div>
                    <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
                        <li className="nv-menu cls" onClick={(e) => {e.preventDefault();setMenuOpen(false);}}><span className="nav-link">&times;</span></li>
                        <li className="nav-item">
                            <Link href="#" className="nav-link dropdown-toggle">Products</Link>
                            <ul className="dropdown-menu">
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-building-user fa-2x"></i><p>Employee Learning Cloud <span>Develop & retain top talent through learning</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-users fa-2x"></i> <p>Customer Learning Cloud <span>Boost retention & brnad loyalty through education</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-cloud fa-2x"></i> <p>Embedded Learning Cloud<span>Embed on-brand traning experiencesin your HR platform</span></p></Link></li>
                            </ul>
                        </li>
                        <li className="nav-item">
                            <Link href="#" className="nav-link">Customers</Link> 
                        </li>
                        <li className="nav-item">
                            <Link href="#" className="nav-link">Pricing</Link> 
                        </li>
                        <li className="nav-item">
                            <Link href="#" className="nav-link dropdown-toggle">Company</Link>
                            <ul className="dropdown-menu">
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-building fa-2x"></i><p>About <span>Learn about our team, mission & vision</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-blog fa-2x"></i><p>Blog <span>Read up on industry trends, insights and pro-tips</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-brands fa-sourcetree fa-2x"></i><p>Resources <span>Catchup on webinars,podcasts,episodes and more</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-brands fa-hire-a-helper fa-2x"></i><p>Help center <span>Access 24/7 support resources</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-medal fa-2x"></i><p>Academy <span>Learn about our team, mission & vision</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-brands fa-slack fa-2x"></i><p>Slack community <span>Connect with fellow learning opts users</span></p></Link></li>
                                <li className="dropdown-item"><Link href="#" className="dropdown-link"><i className="fa-solid fa-handshake-angle fa-2x"></i><p>Partners <span>Join our certified partners program</span></p></Link></li>
                                
                            </ul>
                        </li>
                        <li className="nav-item">
                            {user ? (
                                        <span className="nav-link" onClick={handleLogout} style={{cursor:"pointer"}}>
                                        Logout
                                        </span>
                                    ) : (
                                        <Link className="nav-link" to="/login">Login</Link>
                                    )}
                        </li>
                        <li className="nv-item"><Link className="nav-link" to="/login">Contact us</Link></li>

                    </ul>
                    <div className="hamburg" onClick={() => setMenuOpen(true)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </nav>
        </div>
    </header>
    <main className="main">
      <section id="hero" className="hero section dark-background">
        <div className="container" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content" data-aos="fade-up" data-aos-delay="100">
                <div className="hero-tag">
                  <i className="bi bi-rocket-takeoff"></i>
                  <span>Smart Learning Platform</span>
                </div>
                <h1>
                  Empowering <span className="highlight">Digital Learning</span> with Learning Opts LMS
                </h1>
                <p className="lead">
                  Learning Opts LMS helps institutions, corporates, and government organizations
                  create, manage, and deliver powerful online training programs with ease and efficiency.
                </p>
                <ul className="hero-features">
                  <li><i className="bi bi-check-circle"></i> Complete Course & Batch Management</li>
                  <li><i className="bi bi-check-circle"></i> Online Assessments & Certification</li>
                  <li><i className="bi bi-check-circle"></i> Real-Time Progress & Performance Tracking</li>
                </ul>
                <div className="hero-cta">
                  <Link href="#services" className="btn btn-primary">
                    Explore LMS Features
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image-wrapper" data-aos="fade-up" data-aos-delay="300">
                <img
                  src="/assets/img/about/about-square-13.webp"
                  alt=""
                  className="img-fluid hero-image"
                />
                <div className="stat-card top-right">
                  <div className="stat-value">25K+</div>
                  <div className="stat-label">Active Learners</div>
                  <div className="stat-icon">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                </div>
                <div className="stat-card bottom-left">
                  <div className="stat-value">500+</div>
                  <div className="stat-label">Courses Delivered Successfully</div>
                  <div className="stat-icon">
                    <i className="bi bi-graph-up"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="about" className="about section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center" data-aos="fade-up" data-aos-delay="200">
              <h2 className="section-heading">Our Vision &amp; Mission</h2>
              <p className="lead">
                At Learning Opts LMS, our mission is to simplify and modernize digital education by
                providing powerful, scalable, and user-friendly learning solutions for institutions,
                corporates, and government skill programs.
              </p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="100">
              <div className="feature-box">
                <div className="icon-container">
                  <i className="bi bi-lightbulb"></i>
                </div>
                <h4>Innovation</h4>
                <p>
                  Building modern LMS solutions with smart automation, seamless integrations,
                  and advanced learning tools to enhance digital education delivery.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="200">
              <div className="feature-box">
                <div className="icon-container">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <h4>Growth</h4>
                <p>
                  Empowering organizations to scale training programs efficiently while
                  improving learner engagement and measurable outcomes.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="300">
              <div className="feature-box">
                <div className="icon-container">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h4>Security</h4>
                <p>
                  Ensuring secure data management, role-based access control, and
                  reliable performance across all learning environments.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="400">
              <div className="feature-box">
                <div className="icon-container">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h4>Collaboration</h4>
                <p>
                  Connecting learners, trainers, and administrators through interactive
                  tools that promote communication and shared success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="services" className="services section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Services</h2>
          <p>Comprehensive LMS solutions designed to simplify training, enhance engagement, and scale learning programs efficiently.</p>
        </div>
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="services-row">
            <div className="row">
              <div className="col-lg-4">
                <div className="services-headline">
                  <p className="services-subtitle">LMS Expertise</p>
                  <h2 className="services-title">Powerful Learning Solutions We Provide</h2>
                </div>
                <div className="services-description" data-aos="fade-up" data-aos-delay="100">
                  <p>
                    Learning Opts LMS offers scalable digital learning tools for institutions,
                    corporates, and government skill development programs to manage training
                    seamlessly from start to finish.
                  </p>
                </div>
                <div className="services-image-container">
                  <div className="services-image">
                    <img src="/assets/img/services/services-12.webp" alt="Services" className="img-fluid" />
                  </div>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="services-grid">
                  <div className="row gy-4">
                    <div className="col-md-6" data-aos="fade-up" data-aos-delay="100">
                      <div className="service-card">
                        <div className="service-content text-center">
                          <div className="service-icon">
                            <i className="bi bi-cash-stack"></i>
                          </div>
                          <div className="service-info">
                            <h3><Link href="#">Course & Batch Management</Link></h3>
                            <p>
                              Create, organize, and manage courses, batches, trainers,
                              and learners with complete administrative control.
                            </p>
                            <div className="service-action">
                              <Link href="service-details.html" className="read-more-btn">
                                Details <i className="bi bi-arrow-right"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6" data-aos="fade-up" data-aos-delay="200">
                      <div className="service-card">
                        <div className="service-content text-center">
                          <div className="service-icon">
                            <i className="bi bi-list-check"></i>
                          </div>
                          <div className="service-info">
                            <h3><Link href="#">Online Assessments</Link></h3>
                            <p>
                              Conduct secure online exams, quizzes, and assignments
                              with automated evaluation and instant result generation.
                            </p>
                            <div className="service-action">
                              <Link href="service-details.html" className="read-more-btn">
                                View More <i className="bi bi-arrow-right"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6" data-aos="fade-up" data-aos-delay="300">
                      <div className="service-card">
                        <div className="service-content text-center">
                          <div className="service-icon">
                            <i className="bi bi-bar-chart"></i>
                          </div>
                          <div className="service-info">
                            <h3><Link href="#">Progress & Performance Tracking</Link></h3>
                            <p>
                              Monitor learner progress, attendance, and performance
                              through detailed dashboards and real-time analytics.
                            </p>
                            <div className="service-action">
                              <Link href="service-details.html" className="read-more-btn">
                                Read More <i className="bi bi-arrow-right"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6" data-aos="fade-up" data-aos-delay="400">
                      <div className="service-card">
                        <div className="service-content text-center">
                          <div className="service-icon">
                            <i className="bi bi-pie-chart"></i>
                          </div>
                          <div className="service-info">
                            <h3><Link href="#">Certification & Reporting</Link></h3>
                            <p>
                              Generate automated certificates and export detailed
                              reports to evaluate training effectiveness and compliance.
                            </p>
                            <div className="service-action">
                              <Link href="service-details.html" className="read-more-btn">
                                Learn More <i className="bi bi-arrow-right"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="clients" className="clients section">
        <div className="container section-title" data-aos="fade-up" data-aos-delay="100">
            <h2>Clients</h2>
            <p>Trusted by educational institutions, corporate organizations, and government skill development programs to deliver scalable and effective digital learning solutions.</p>
        </div>
      <div className="container-fluid">

        <div className="clients-slider">
          <div className="clients-track track-1" data-aos="fade-right" data-aos-delay="200">
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
          </div>
        </div>

        <div className="clients-slider">
          <div className="clients-track track-2" data-aos="fade-left" data-aos-delay="300">
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
          </div>
        </div>

      </div>
     </section>
     <section id="pricing" className="services section">
      <div className="container section-title" data-aos="fade-up">
        <h2>Pricing</h2>
        <p>
          Flexible and scalable pricing plans for institutions, corporates and
          government skill development programs.
        </p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">

        <div className="services-row">
          <div className="row">
            {/* RIGHT SIDE PRICING CARDS */}
            <div className="col-lg-12">
              <div className="services-grid">
                <div className="row gy-4">

                  {/* Starter */}
                  <div className="col-md-3" data-aos="fade-up" data-aos-delay="100">
                    <div className="service-card text-center">
                      <div className="service-content">
                        <div className="service-icon">
                          <i className="bi bi-mortarboard"></i>
                        </div>
                        <div className="service-info">
                          <h3><Link href="#">Starter Plan</Link></h3>
                          <h4 className="mt-2">₹9,999 / Year</h4>
                          <p>
                            ✔ Up to 200 Learners <br/>
                            ✔ Course Management <br/>
                            ✔ Basic Assessments <br/>
                            ✔ Standard Reports
                          </p>
                          <div className="service-action">
                            <Link href="#" className="read-more-btn">
                              Get Started <i className="bi bi-arrow-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional */}
                  <div className="col-md-3" data-aos="fade-up" data-aos-delay="200">
                    <div className="service-card text-center position-relative">
                      <div className="service-content">
                        <div className="service-icon">
                          <i className="bi bi-building"></i>
                        </div>
                        <div className="service-info">
                          <h3><Link href="#">Professional Plan</Link></h3>
                          <h4 className="mt-2">₹24,999 / Year</h4>
                          <p>
                            ✔ Up to 1,000 Learners <br/>
                            ✔ Advanced Assessments <br/>
                            ✔ Certification System <br/>
                            ✔ Detailed Analytics
                          </p>
                          <div className="service-action">
                            <Link href="#" className="read-more-btn">
                              Choose Plan <i className="bi bi-arrow-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise */}
                  <div className="col-md-3" data-aos="fade-up" data-aos-delay="300">
                    <div className="service-card text-center">
                      <div className="service-content">
                        <div className="service-icon">
                          <i className="bi bi-globe2"></i>
                        </div>
                        <div className="service-info">
                          <h3><Link href="#">Enterprise Plan</Link></h3>
                          <h4 className="mt-2">Custom Pricing</h4>
                          <p>
                            ✔ Unlimited Learners <br/>
                            ✔ Government Skill Modules <br/>
                            ✔ Dedicated Support <br/>
                            ✔ Custom Integrations
                          </p>
                          <div className="service-action">
                            <Link href="#" className="read-more-btn">
                              Contact Sales <i className="bi bi-arrow-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add-On Plan (Extra card to balance grid) */}
                  <div className="col-md-3" data-aos="fade-up" data-aos-delay="400">
                    <div className="service-card text-center">
                      <div className="service-content">
                        <div className="service-icon">
                          <i className="bi bi-puzzle"></i>
                        </div>
                        <div className="service-info">
                          <h3><Link href="#">Add-On Modules</Link></h3>
                          <h4 className="mt-2">Optional</h4>
                          <p>
                            ✔ Custom Integrations <br/>
                            ✔ API Access <br/>
                            ✔ White Labeling <br/>
                            ✔ Advanced Reporting
                          </p>
                          <div className="service-action">
                            <Link href="#" className="read-more-btn">
                              Learn More <i className="bi bi-arrow-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
     <section id="faq" className="faq section">
      <div className="container section-title" data-aos="fade-up">
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about Learning Opts LMS and how it can support your training programs.</p>
      </div>
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="tab-content" id="faqTabContent">
              <div className="tab-pane fade show active" id="faq-general" role="tabpanel" aria-labelledby="general-tab">
                <div className="faq-list">

                {/* FAQ 1 */}
                <div className="faq-item" data-aos="fade-up" data-aos-delay="200">
                  <h3 onClick={() => toggleFAQ(1)} style={{ cursor: "pointer" }}>
                    <span className="num">1</span>
                    <span className="question">
                      What is Learning Opts LMS used for?
                    </span>
                    <i className={`bi ${activeIndex === 1 ? "bi-dash-lg" : "bi-plus-lg"} faq-toggle`}></i>
                  </h3>
                  {activeIndex === 1 && (
                    <div className="faq-content">
                      <p>
                        Learning Opts LMS is a complete Learning Management System
                        designed to manage courses, learners, trainers, assessments,
                        certifications, and reporting in one centralized platform.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 2 */}
                <div className="faq-item" data-aos="fade-up" data-aos-delay="300">
                  <h3 onClick={() => toggleFAQ(2)} style={{ cursor: "pointer" }}>
                    <span className="num">2</span>
                    <span className="question">
                      Can it support government skill development programs?
                    </span>
                    <i className={`bi ${activeIndex === 2 ? "bi-dash-lg" : "bi-plus-lg"} faq-toggle`}></i>
                  </h3>
                  {activeIndex === 2 && (
                    <div className="faq-content">
                      <p>
                        Yes. Learning Opts LMS is built to handle large-scale
                        government and institutional skill programs including
                        batch management, attendance tracking, assessments,
                        and certification workflows.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 3 */}
                <div className="faq-item" data-aos="fade-up" data-aos-delay="400">
                  <h3 onClick={() => toggleFAQ(3)} style={{ cursor: "pointer" }}>
                    <span className="num">3</span>
                    <span className="question">
                      Does the platform provide performance reports?
                    </span>
                    <i className={`bi ${activeIndex === 3 ? "bi-dash-lg" : "bi-plus-lg"} faq-toggle`}></i>
                  </h3>
                  {activeIndex === 3 && (
                    <div className="faq-content">
                      <p>
                        Absolutely. The system provides real-time dashboards,
                        learner progress tracking, assessment analytics, and
                        downloadable reports for better decision-making.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
            <div className="faq-cta text-center mt-5" data-aos="fade-up" data-aos-delay="300">
              <p>Still have questions? We're here to help!</p>
              <Link href="#" className="btn btn-primary">Contact Support</Link>
            </div>
          </div>
        </div>

      </div>

     </section>
     <section id="call-to-action" className="call-to-action section">
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="cta-wrapper">
          <div className="cta-content" data-aos="fade-right" data-aos-delay="200">
            <h2>Transform Your Training with Learning Opts LMS</h2>
            <p>
              Empower your institution, corporate team, or government skill program
              with a powerful digital learning platform designed for scalability,
              efficiency, and measurable results.
            </p>
            <div className="cta-buttons">
              <Link href="#" className="btn btn-primary">
                Get Started Today
              </Link>
            </div>
          </div>
          <div className="cta-image" data-aos="fade-left" data-aos-delay="300">
            <img
              src="/assets/img/illustration/illustration-13.webp"
              alt="CTA Illustration"
              className="img-fluid"
            />
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
              <img src="/images/lms-logo.png" className="nv-img" alt="Learning Opts Logo"/> 
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
  <Link href="#" id="scroll-top" className="scroll-top d-flex align-items-center justify-content-center"><i className="bi bi-arrow-up-short"></i></Link>
    </>
  );
}
