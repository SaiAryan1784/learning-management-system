// src/pages/staff/StaffCertificates.jsx

import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";

export default function StaffCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCertificates = async () => {
    try {
      const certRes = await api.get("/certificates/me");
      const certs = certRes.data.certificates || [];

      const unique = [];
      const seen = new Set();

      certs.forEach((c) => {
        if (!seen.has(c.course?._id)) {
          seen.add(c.course?._id);
          unique.push(c);
        }
      });

      setCertificates(unique);

      const dashRes = await api.get("/progress/me/dashboard");
      setCoursesProgress(dashRes.data.courses || []);

    } catch (err) {
      toastr.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  if (loading) return <div className="mx-wd">Loading...</div>;

  const eligibleCertificates = certificates.filter((cert) => {
    const course = coursesProgress.find(
      (c) => c.courseId === cert.course?._id
    );

    return course && course.progressPercent === 100;
  });

  if (!eligibleCertificates.length)
    return (
      <div className="mx-wd">
        <h2 className="sc-tl">No Completed Course Certificates Found</h2>
        <p>
          Complete all lessons and pass final quiz to unlock your certificate.
        </p>
      </div>
    );

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">My Certificates</h1>
      </div>

      {/* ===== COURSE CARDS ===== */}
      <div className="row mt-4">
        {eligibleCertificates.map((cert) => (
          <div key={cert._id} className="col-md-6 mb-4">
            <div className="card shadow-sm p-4 text-center">

              <h4 className="mb-2">{cert.course?.title}</h4>
              <p className="text-muted">
                Issued on{" "}
                {new Date(cert.issuedAt).toLocaleDateString()}
              </p>

              <button
                className="btn btn-success mt-2"
                onClick={() => setSelectedCert(cert)}
              >
                View Certificate
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* ===== CERTIFICATE MODAL ===== */}
{selectedCert && (
  <div className="cert-modal-overlay">
    <div className="cert-modal">

      <button
        className="cert-close"
        onClick={() => setSelectedCert(null)}
      >
        ✖
      </button>

      <div className="certificate-premium">

        {/* Header */}
      <img src="/images/triangle.png" alt="seal" className="tri-right" />
      <img src="/images/triangle.png" alt="seal" className="tri-left" />
        <div className="cert-divider"></div>

        <div className="cert-heading">
          <img
              src="/images/title-img.png"
              alt="seal"
              className="seal-img"
            />
        </div>

        <h3 className="cert-student">
          {selectedCert.staff?.name}
        </h3>
        <h3 className="cert-course-name">
          {selectedCert.course?.title}
        </h3>

        <div className="cert-divider"></div>
         <p className="cert-description">
          Congratulations! This is to certify that you have successfully completed the OWNER'S ONBOARDING TRAINING
        </p>
        <div className="mt-3">
            <p>DATE:  <span>
              {new Date(
                selectedCert.issuedAt
              ).toLocaleDateString()}
            </span></p>
          </div>
        {/* Footer Info */}
        <div className="cert-footer-row">
          <div>
            <p>CEO</p>
            <p className="meta-title">Nick Beghtol</p>
          </div>
            <div>
              <img
              src="/images/stamp.png"
              alt="seal"
              className="stamp"
            />
            </div>
          <div>
            <p>Co-Founder</p>
            <p className="meta-title">Bailey Ames</p>
          </div>
        </div>
        <div className="cert-div"></div>
        
      </div>
    </div>
  </div>
)}
    </div>
  );
}