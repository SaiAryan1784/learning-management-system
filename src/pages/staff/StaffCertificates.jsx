import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { useAuth } from "../../auth/AuthContext";
import { PERM } from "../../auth/access";
import {
  PageHeader,
  Button,
  Card,
  Modal,
  EmptyState,
  SkeletonCard,
} from "../../components/ui";
import CertificatePreview, {
  CertificatePrintStyles,
  resolveCertDesign,
} from "../../components/certificates/CertificatePreview";


export { CERT_FONTS } from "../../components/certificates/CertificatePreview";

export default function StaffCertificates({ embedded = false }) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission(PERM.certificatesTeam);

  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [orgCert, setOrgCert] = useState({});
  const [loading, setLoading] = useState(true);

  const loadCertificates = async () => {
    try {
      const certRes = await api.get("/certificates/me");
      // A certificate only exists once a course is completed and all quizzes
      // passed, so every issued certificate is already earned — show them all.
      setCertificates(certRes.data.certificates || []);
    } catch {
      toastr.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    // Org-wide default certificate template — used as a fallback for fields a course
    // doesn't set, and for the org's own uploaded design.
    api
      .get("/organization/settings")
      .then((res) => setOrgCert(res.data.organization?.certificateSettings || {}))
      .catch(() => {});
  }, []);

  const handlePrint = () => {
    // Print CSS (below) hides everything except #cert-print, so the browser's
    // print / "Save as PDF" dialog exports just the certificate.
    window.print();
  };

  return (
    <div className="space-y-5">
      <CertificatePrintStyles />

      {!embedded && (
        <PageHeader title="My Certificates" subtitle="Certificates earned from completed courses">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="!text-white !border-white/20 hover:!bg-white/10"
              leadingIcon={<i className="fa-solid fa-gear text-xs" />}
              onClick={() => navigate("/dashboard/certificates/manage")}
            >
              Manage
            </Button>
          )}
        </PageHeader>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<i className="fa-solid fa-certificate" />}
            title="No certificates yet"
            description="Complete all lessons and pass the final quiz to unlock your certificate."
          />
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {certificates.map((cert) => (
            <motion.div
              key={cert._id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-muted flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-certificate text-icon"></i>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-body font-semibold text-brand-text truncate">
                      {cert.subject?.title || cert.course?.title}
                    </h4>
                    <p className="text-caption text-brand-muted">
                      Issued {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="mt-auto"
                  leadingIcon={<i className="fa-regular fa-eye text-xs" />}
                  onClick={() => setSelectedCert(cert)}
                >
                  View &amp; Download
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title="Certificate"
        maxWidth="max-w-2xl"
      >
        {selectedCert && (
          <>
            <CertificatePreview cert={selectedCert} orgCert={orgCert} />
            <div className="no-print flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCert(null)}>
                Close
              </Button>
              {(() => {
                const { isUpload, designSrc, designType } = resolveCertDesign(selectedCert, orgCert);
                return isUpload && designType === "pdf" ? (
                  <a href={designSrc} target="_blank" rel="noreferrer" download>
                    <Button variant="primary" size="sm" leadingIcon={<i className="fa-solid fa-download text-xs" />}>
                      Download PDF
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leadingIcon={<i className="fa-solid fa-download text-xs" />}
                    onClick={handlePrint}
                  >
                    Print / Save PDF
                  </Button>
                );
              })()}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
