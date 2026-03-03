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

        {/* Watermark */}
        <div className="cert-watermark">
          <img
            src="/images/lms-logo.png"
            className=""
            alt="Brand Logo"
          />
        </div>

        {/* Header */}
        <div className="cert-header">
          {/* <img
            src="/images/lms-logo.png"
            className="cert-main-logo"
            alt="Brand Logo"
          /> */}
          <h1 className="org-name">LEARNING OPTS</h1>
        </div>

        <h2 className="cert-heading">
          Certificate of Completion
        </h2>

        <p className="cert-presented">
          This Certificate is proudly presented to
        </p>

        <h3 className="cert-student">
          {selectedCert.staff?.name}
        </h3>

        <p className="cert-description">
          For successfully completing the professional course
        </p>

        <h3 className="cert-course-name">
          {selectedCert.course?.title}
        </h3>

        <div className="cert-divider"></div>

        {/* Footer Info */}
        <div className="cert-footer-row">
          <div>
            <p className="meta-title">Certificate No</p>
            <p>{selectedCert.certificateNo}</p>
          </div>

          <div>
            <p className="meta-title">Verification Code</p>
            <p>{selectedCert.verificationCode}</p>
          </div>

          <div>
            <p className="meta-title">Issued On</p>
            <p>
              {new Date(
                selectedCert.issuedAt
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Signature + Seal */}
        <div className="cert-sign-seal">
          <div className="signature-block">
            <img
              src="/signature.png"
              alt="signature"
              className="signature-img"
            />
            <p className="sign-line"></p>
            <p className="sign-name">Authorized Signatory</p>
          </div>

          <div className="seal-block">
            <img
              src="/images/stmp.png"
              alt="seal"
              className="seal-img"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
)}
    </div>
  );
}