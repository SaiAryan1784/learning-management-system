import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import {
  PageHeader,
  Button,
  Card,
  Modal,
  EmptyState,
  SkeletonCard,
} from "../../components/ui";

export default function StaffCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
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
  }, []);

  const handlePrint = () => {
    // Print CSS (below) hides everything except #cert-print, so the browser's
    // print / "Save as PDF" dialog exports just the certificate.
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Print-only styling: show solely the certificate node when printing. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cert-print, #cert-print * { visibility: visible !important; }
          #cert-print {
            position: fixed; inset: 0; margin: 0; padding: 48px;
            width: 100%; box-shadow: none !important; background: #fff !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <PageHeader title="My Certificates" subtitle="Certificates earned from completed courses" />

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
                    <i className="fa-solid fa-certificate text-emerald"></i>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-body font-semibold text-brand-text truncate">
                      {cert.course?.title}
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
            <div
              id="cert-print"
              className="relative overflow-hidden bg-gradient-to-b from-emerald-muted/40 to-surface rounded-xl p-8 border border-brand-border"
            >
              <div className="text-center mb-6">
                <img src="/images/title-img.png" alt="seal" className="h-16 mx-auto mb-4" />
                <h3 className="text-caption font-bold text-brand-muted uppercase tracking-widest mb-4">
                  Certificate of Completion
                </h3>
                <div className="h-px bg-brand-border mb-4" />
                <p className="text-caption text-brand-muted uppercase tracking-wider mb-2">
                  This certifies that
                </p>
                <h2 className="text-display text-brand-text mb-1">
                  {selectedCert.staff?.name || "—"}
                </h2>
                <p className="text-caption text-brand-muted uppercase tracking-wider mb-2">
                  has successfully completed
                </p>
                <h3 className="text-subheading text-emerald-hover mb-4">
                  {selectedCert.course?.title}
                </h3>
                <div className="h-px bg-brand-border mb-4" />
                <p className="text-caption text-brand-muted mb-2">
                  Issued on {new Date(selectedCert.issuedAt).toLocaleDateString()}
                  {selectedCert.expiresAt
                    ? ` · Valid until ${new Date(selectedCert.expiresAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>

              <div className="flex items-center justify-center mb-4">
                <img src="/images/stamp.png" alt="stamp" className="h-14 opacity-80" />
              </div>

              <div className="text-center">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider">
                  Certificate No.
                </p>
                <p className="text-caption font-semibold text-brand-text mb-1">
                  {selectedCert.certificateNo}
                </p>
                {selectedCert.verificationCode && (
                  <p className="text-[10px] text-brand-muted">
                    Verification code: {selectedCert.verificationCode}
                  </p>
                )}
              </div>
            </div>

            <div className="no-print flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCert(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leadingIcon={<i className="fa-solid fa-download text-xs" />}
                onClick={handlePrint}
              >
                Print / Save PDF
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
