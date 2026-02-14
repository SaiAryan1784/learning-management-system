
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
    const { user, logout } = useAuth();
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
                            src="../src/images/lms-logo.png"
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
                <span>Innovative Solutions</span>
              </div>
              <h1>Achieving <span className="highlight">Outstanding Results</span> for Your Growth</h1>
              <p className="lead">Our dedicated team provides exceptional service to help you reach your business goals effectively.</p>
              <ul className="hero-features">
                <li><i className="bi bi-check-circle"></i> Streamlined operational processes</li>
                <li><i className="bi bi-check-circle"></i> Enhanced customer engagement strategies</li>
                <li><i className="bi bi-check-circle"></i> Data-driven decision support</li>
              </ul>
              <div className="hero-cta">
                <Link href="#services" className="btn btn-primary">Explore Our Services</Link>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-image-wrapper" data-aos="fade-up" data-aos-delay="300">
              <img src="/src/assets/img/about/about-square-13.webp" alt="" className="img-fluid hero-image"/>
              <div className="stat-card top-right">
                <div className="stat-value">18.9K</div>
                <div className="stat-label">Improved market presence</div>
                <div className="stat-icon">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
              </div>
              <div className="stat-card bottom-left">
                <div className="stat-value">+450%</div>
                <div className="stat-label">Increased lead generation</div>
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
            <p className="lead">We're dedicated to transforming businesses through innovative solutions and strategic expertise that drive sustainable growth.</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="100">
            <div className="feature-box">
              <div className="icon-container">
                <i className="bi bi-lightbulb"></i>
              </div>
              <h4>Innovation</h4>
              <p>Pioneering solutions that challenge conventional thinking and create new opportunities for success.</p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="200">
            <div className="feature-box">
              <div className="icon-container">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <h4>Growth</h4>
              <p>Facilitating sustainable expansion through strategic planning and calculated execution.</p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="300">
            <div className="feature-box">
              <div className="icon-container">
                <i className="bi bi-shield-check"></i>
              </div>
              <h4>Integrity</h4>
              <p>Upholding the highest standards of ethics, transparency and accountability in all our endeavors.</p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="400">
            <div className="feature-box">
              <div className="icon-container">
                <i className="bi bi-people-fill"></i>
              </div>
              <h4>Collaboration</h4>
              <p>Working alongside our clients as partners to achieve mutual growth and shared success.</p>
            </div>
          </div>
        </div>

      </div>

      </section>
      <section id="services" className="services section">
      <div className="container section-title" data-aos="fade-up">
        <h2>Services</h2>
        <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay="100">

        <div className="services-row">
          <div className="row">
            <div className="col-lg-4">
              <div className="services-headline">
                <p className="services-subtitle">Expert Guidance</p>
                <h2 className="services-title">Innovative Solutions We Provide</h2>
              </div>

              <div className="services-description" data-aos="fade-up" data-aos-delay="100">
                <p>Our team delivers cutting-edge strategies to help you achieve your goals. Discover how our tailored services can benefit your business.</p>
              </div>

              <div className="services-image-container">
                <div className="services-image">
                  <img src="src/assets/img/services/services-12.webp" alt="Services" className="img-fluid" />
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
                          <h3><Link href="#">Strategic Planning</Link></h3>
                          <p>We offer customized plans to optimize your operations and improve overall efficiency across the board.</p>
                          <div className="service-action">
                            <Link href="service-details.html" className="read-more-btn">Details <i className="bi bi-arrow-right"></i></Link>
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
                          <h3><Link href="#">Digital Marketing</Link></h3>
                          <p>Our expert team crafts engaging campaigns that connect with your audience and drive conversions effectively.</p>
                          <div className="service-action">
                            <Link href="service-details.html" className="read-more-btn">View More <i className="bi bi-arrow-right"></i></Link>
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
                          <h3><Link href="#">Performance Analysis</Link></h3>
                          <p>We analyze your data to provide actionable insights, helping you make informed decisions for future growth.</p>
                          <div className="service-action">
                            <Link href="service-details.html" className="read-more-btn">Read More <i className="bi bi-arrow-right"></i></Link>
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
                          <h3><Link href="#">Market Research</Link></h3>
                          <p>Understanding your market is key, and we provide comprehensive research to give you a competitive edge.</p>
                          <div className="service-action">
                            <Link href="service-details.html" className="read-more-btn">Learn More <i className="bi bi-arrow-right"></i></Link>
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
            <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p>
        </div>
      <div className="container-fluid">

        <div className="clients-slider">
          <div className="clients-track track-1" data-aos="fade-right" data-aos-delay="200">
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
          </div>
        </div>

        <div className="clients-slider">
          <div className="clients-track track-2" data-aos="fade-left" data-aos-delay="300">
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-8.webp" className="img-fluid" alt="Client 8" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-7.webp" className="img-fluid" alt="Client 7" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-6.webp" className="img-fluid" alt="Client 6" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-5.webp" className="img-fluid" alt="Client 5" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-4.webp" className="img-fluid" alt="Client 4" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-3.webp" className="img-fluid" alt="Client 3" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-2.webp" className="img-fluid" alt="Client 2" />
            </div>
            <div className="clients-slide">
              <img src="src/assets/img/clients/clients-1.webp" className="img-fluid" alt="Client 1" />
            </div>
          </div>
        </div>

      </div>

     </section>
     <section id="faq" className="faq section">
      <div className="container section-title" data-aos="fade-up">
        <h2>Frequently Asked Questions</h2>
        <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p>
      </div>
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="tab-content" id="faqTabContent">
              <div className="tab-pane fade show active" id="faq-general" role="tabpanel" aria-labelledby="general-tab">
                <div className="faq-list">

                  <div className="faq-item" data-aos="fade-up" data-aos-delay="200">
                    <h3>
                      <span className="num">1</span>
                      <span className="question">Lorem ipsum dolor sit amet, consectetur adipiscing elit?</span>
                      <i className="bi bi-plus-lg faq-toggle"></i>
                    </h3>
                    <div className="faq-content">
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.</p>
                    </div>
                  </div>

                  <div className="faq-item" data-aos="fade-up" data-aos-delay="300">
                    <h3>
                      <span className="num">2</span>
                      <span className="question">Feugiat scelerisque varius morbi enim nunc faucibus a pellentesque?</span>
                      <i className="bi bi-plus-lg faq-toggle"></i>
                    </h3>
                    <div className="faq-content">
                      <p>Dolor sit amet consectetur adipiscing elit pellentesque habitant morbi. Id interdum velit laoreet id donec ultrices. Fringilla phasellus faucibus scelerisque eleifend donec pretium. Est pellentesque elit ullamcorper dignissim.</p>
                      <p>Mauris ultrices eros in cursus turpis massa tincidunt dui. Pellentesque nec nam aliquam sem et tortor. Habitant morbi tristique senectus et netus et malesuada.</p>
                    </div>
                  </div>

                  <div className="faq-item" data-aos="fade-up" data-aos-delay="400">
                    <h3>
                      <span className="num">3</span>
                      <span className="question">Dolor sit amet consectetur adipiscing elit pellentesque?</span>
                      <i className="bi bi-plus-lg faq-toggle"></i>
                    </h3>
                    <div className="faq-content">
                      <p>Eleifend mi in nulla posuere sollicitudin aliquam ultrices sagittis orci. Faucibus pulvinar elementum integer enim. Sem nulla pharetra diam sit amet nisl suscipit. Rutrum tellus pellentesque eu tincidunt. Lectus urna duis convallis convallis tellus.</p>
                      <p>Mauris ultrices eros in cursus turpis massa tincidunt dui. Pellentesque nec nam aliquam sem et tortor. Habitant morbi tristique senectus et netus et malesuada.</p>
                    </div>
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
            <h2>Unlock Your Full Potential Today!</h2>
            <p>Join thousands of satisfied customers who have transformed their lives with our innovative solutions.</p>
            <div className="cta-buttons">
              <Link href="#" className="btn btn-primary">Get Started Now</Link>
            </div>
          </div>
          <div className="cta-image" data-aos="fade-left" data-aos-delay="300">
            <img src="/src/assets/img/illustration/illustration-13.webp" alt="CTA Illustration" className="img-fluid" />
          </div>
        </div>
      </div>
     </section>
    </main>
    <footer id="footer" className="footer position-relative">

    <div className="container footer-top">
      <div className="row gy-4">
        <div className="col-lg-4 col-md-6 footer-about">
          <Link href="" className="logo d-flex align-items-center">
            <img src="../src/images/lms-logo.png" className="nv-img" alt="Brand Logo"/> 
          </Link>
          <div className="footer-contact pt-3">
            <p>A108 Adam Street</p>
            <p>New York, NY 535022</p>
            <p className="mt-3"><strong>Phone:</strong> <span>+1 5589 55488 55</span></p>
            <p><strong>Email:</strong> <span>info@example.com</span></p>
          </div>
          <div className="social-links d-flex mt-4">
            <Link href=""><i className="bi bi-twitter-x"></i></Link>
            <Link href=""><i className="bi bi-facebook"></i></Link>
            <Link href=""><i className="bi bi-instagram"></i></Link>
            <Link href=""><i className="bi bi-linkedin"></i></Link>
          </div>
        </div>

        <div className="col-lg-2 col-md-3 footer-links">
          <h4>Useful Links</h4>
          <ul>
            <li><Link href="#">Home</Link></li>
            <li><Link href="#">About us</Link></li>
            <li><Link href="#">Services</Link></li>
            <li><Link href="#">Terms of service</Link></li>
            <li><Link href="#">Privacy policy</Link></li>
          </ul>
        </div>

        <div className="col-lg-2 col-md-3 footer-links">
          <h4>Our Services</h4>
          <ul>
            <li><Link href="#">Web Design</Link></li>
            <li><Link href="#">Web Development</Link></li>
            <li><Link href="#">Product Management</Link></li>
            <li><Link href="#">Marketing</Link></li>
            <li><Link href="#">Graphic Design</Link></li>
          </ul>
        </div>

        <div className="col-lg-2 col-md-3 footer-links">
          <h4>Hic solutasetp</h4>
          <ul>
            <li><Link href="#">Molestiae accusamus iure</Link></li>
            <li><Link href="#">Excepturi dignissimos</Link></li>
            <li><Link href="#">Suscipit distinctio</Link></li>
            <li><Link href="#">Dilecta</Link></li>
            <li><Link href="#">Sit quas consectetur</Link></li>
          </ul>
        </div>

        <div className="col-lg-2 col-md-3 footer-links">
          <h4>Nobis illum</h4>
          <ul>
            <li><Link href="#">Ipsam</Link></li>
            <li><Link href="#">Laudantium dolorum</Link></li>
            <li><Link href="#">Dinera</Link></li>
            <li><Link href="#">Trodelas</Link></li>
            <li><Link href="#">Flexo</Link></li>
          </ul>
        </div>

      </div>
    </div>
    <div className="container copyright text-center mt-4">
      <p>© <span>Copyright</span> <strong className="px-1 sitename">Learing Opts</strong> <span>All Rights Reserved</span></p>
      <div className="credits">
        Designed by Learning Opts
      </div>
    </div>
  </footer>
  <Link href="#" id="scroll-top" className="scroll-top d-flex align-items-center justify-content-center"><i className="bi bi-arrow-up-short"></i></Link>
    </>
  );
}
