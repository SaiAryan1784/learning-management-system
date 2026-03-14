import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
export default function ContactUs() {
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
                  <img src="/images/lms.png" className="nv-img" alt="Logo" />
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
            <h1 className="mb-2 mb-lg-0">Contact Us</h1>
            <nav className="breadcrumbs">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Contact</li>
              </ol>
            </nav>
          </div>
        </div>

        <section className="contact-section">
          <div className="container">
            <div className="row gy-4">
              
              {/* Contact Info Side */}
              <div className="col-lg-5" data-aos="fade-right">
                <div className="info-wrap shadow-sm h-100">
                  <div className="info-item d-flex">
                    <i className="bi bi-geo-alt flex-shrink-0"></i>
                    <div>
                      <h3>Address</h3>
                      <p>123 Education Lane, Tech Park, Hyderabad, India</p>
                    </div>
                  </div>

                  <div className="info-item d-flex">
                    <i className="bi bi-telephone flex-shrink-0"></i>
                    <div>
                      <h3>Call Us</h3>
                      <p>+91 90000 00000</p>
                    </div>
                  </div>

                  <div className="info-item d-flex">
                    <i className="bi bi-envelope flex-shrink-0"></i>
                    <div>
                      <h3>Email Us</h3>
                      <p>support@learningopts.com</p>
                    </div>
                  </div>

                  {/* Placeholder for Google Maps or an Image */}
                  <div className="contact-map mt-4">
                    <iframe 
                      title="location"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.757764001004!2d78.3822133!3d17.4367623!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c3e347b%3A0x43d973077730d07a!2sHitech%20City!5e0!3m2!1sen!2sin!4v1679456789012!5m2!1sen!2sin" 
                      width="100%" height="250" style={{border:0, borderRadius: '10px'}} allowFullScreen="" loading="lazy">
                    </iframe>
                  </div>
                </div>
              </div>

              {/* Contact Form Side */}
              <div className="col-lg-7" data-aos="fade-left">
                <form className="php-email-form shadow-sm h-100">
                  <div className="row gy-4">
                    <div className="col-md-6">
                      <label className="form-label">Your Name</label>
                      <input type="text" name="name" className="login-ip" placeholder="John Doe" required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Your Email</label>
                      <input type="email" className="login-ip" name="email" placeholder="john@example.com" required />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Subject</label>
                      <input type="text" className="login-ip" name="subject" placeholder="How can we help?" required />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Message</label>
                      <textarea className="login-ip" name="message" rows="6" placeholder="Tell us more about your inquiry..." required></textarea>
                    </div>

                    <div className="col-md-12 text-center">
                      <button type="submit" className="snd-btn">Send Message</button>
                    </div>
                  </div>
                </form>
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