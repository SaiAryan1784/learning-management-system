import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

export default function EmployeeLearningCloud() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Content for the Interactive Switcher (Left Side Accordion)
  const interactiveFeatures = [
    {
      title: "L&D and Talent Development",
      description: "Scale your culture and retain top talent with world-class onboarding and leadership development programs.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000",
      icon: "bi-people"
    },
    {
      title: "Sales Enablement",
      description: "Close more deals by certifying your reps with AI-powered roleplays, pitch assessments, and real-time playbooks.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000",
      icon: "bi-graph-up-arrow"
    },
    {
      title: "Compliance & Security",
      description: "Automate mandatory training and keep your organization audit-ready with real-time tracking and reminders.",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
      icon: "bi-shield-check"
    }
  ];

  // Content for the Feature Grid (Card Wise)
  const gridFeatures = [
    {
      title: "AI Course Creation",
      desc: "Boost your speed to impact with AI-powered content creation tools.",
      icon: "bi-lightning-charge-fill",
      color: "blue"
    },
    {
      title: "Personalized Learning",
      desc: "Meet your learners where they are with AI-powered modalities that work best for them.",
      icon: "bi-person-gear",
      color: "purple"
    },
    {
      title: "Prebuilt Content",
      desc: "Choose from 75K+ off-the-shelf courses to help employees develop critical skills.",
      icon: "bi-collection-play",
      color: "indigo"
    },
    {
      title: "Skills Engine",
      desc: "Guide employees through development paths with skills-based learning organization-wide.",
      icon: "bi-cpu",
      color: "cyan"
    },
    {
      title: "AI Pitch Certifications",
      desc: "Certify sales and support teams through AI-driven video and written assessment tools.",
      icon: "bi-patch-check",
      color: "teal"
    },
    {
      title: "AI Reporting",
      desc: "Track training ROI with robust and configurable reports and dashboards.",
      icon: "bi-bar-chart-steps",
      color: "blue"
    }
  ];

  return (
    <div className="cloud-page-wrapper">
      {/* --- HEADER --- */}
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
      <main>
        {/* --- HERO SECTION --- */}
        <div className="page-title light-background">
            <div className="container d-lg-flex justify-content-between align-items-center">
            <h1 className="mb-2 mb-lg-0">Learning Cloud</h1>
            <nav className="breadcrumbs">
                <ol>
                <li><Link to="/">Home</Link></li>
                <li className="current">Employee Learning Cloud</li>
                </ol>
            </nav>
            </div>
        </div>
        <section className="hero-section text-center py-5">
          <div className="container" data-aos="fade-up">
            <div className="hero-tag">
                  <i className="bi bi-rocket-takeoff"></i>
                  <span>Smart Learning Platform</span>
                </div>
            <h1 className="display-3 fw-bold mb-2">The <span>Growth Engine</span> for <br/>Modern Teams</h1>
            <p className="lead text-muted mx-auto mb-2" style={{maxWidth: '750px'}}>
              Onboard, upskill, and certify your workforce with the only platform 
              built to consolidate all your learning needs into one powerful ecosystem.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button className="snd-btn">Get Started</button>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE SECTION (WorkRamp Style) --- */}
        <section className="py-5 overflow-hidden">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-5" data-aos="fade-right">
                <div className="accordion-custom">
                  {interactiveFeatures.map((item, index) => (
                    <div 
                      key={index} 
                      className={`accordion-item-ui ${activeTab === index ? 'active' : ''}`}
                      onClick={() => setActiveTab(index)}
                    >
                      <div className="d-flex align-items-center mb-2">
                         <i className={`bi ${item.icon} me-3`}></i>
                         <h4 className="m-0">{item.title}</h4>
                      </div>
                      <div className="accordion-content">
                        <p className="text-muted">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-lg-7 mt-5 mt-lg-0" data-aos="zoom-in">
                <div className="image-display shadow-lg rounded-4 overflow-hidden bg-white">
                  <img 
                    src={interactiveFeatures[activeTab].image} 
                    alt={interactiveFeatures[activeTab].title} 
                    className="img-fluid fade-in-image"
                    key={activeTab}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- GRID FEATURES SECTION (Card Wise) --- */}
        <section className=" bg-light py-5">
          <div className="container">
            {/* <div className="text-center mb-5" data-aos="fade-up">
              <h2 className="fw-bold">Everything you need to succeed</h2>
              <p className="text-muted">Powerful tools designed for the future of work.</p>
            </div> */}
            <div className="section-title text-center" data-aos="fade-up">
                <h2>Everything you need to succeed</h2>
                <p>Powerful tools designed for the future of work.</p>
            </div>
            <div className="row g-4">
              {gridFeatures.map((feature, index) => (
                <div className="col-lg-4 col-md-6" key={index} data-aos="fade-up" data-aos-delay={index * 50}>
                  <div className="help-card shadow-sm h-100">
                    <div className="help-icon">
                      <i className={`bi ${feature.icon}`}></i>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
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
    </div>
  );
}