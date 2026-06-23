import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { useAuth } from "../../auth/AuthContext";
import {
  PageHeader,
  Button,
  Card,
  Modal,
  EmptyState,
  SkeletonCard,
} from "../../components/ui";

const FILE_BASE_URL = (api.defaults.baseURL || "").replace("/api", "");
const toAbsoluteUrl = (u) => (!u ? "" : u.startsWith("http") ? u : `${FILE_BASE_URL}${u}`);

export const CERT_FONTS = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, sans-serif",
  mono: "'Courier New', monospace",
};

export default function StaffCertificates({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = user?.role?.name?.trim().toLowerCase();
  const isAdmin = roleName === "owner" || roleName === "admin";

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
        {selectedCert && (() => {
          const base = selectedCert.course?.certificate || {};
          // Merge: course values override the org-wide defaults; empty falls back to org.
          const certCfg = {
            title: base.title || orgCert.title || "Certificate of Completion",
            signatoryName: base.signatoryName || orgCert.signatoryName || "",
            signatoryRole: base.signatoryRole || orgCert.signatoryRole || "",
            logoUrl: base.logoUrl || orgCert.logoUrl || "",
            primaryColor: orgCert.primaryColor || "#10B981",
            fontStyle: orgCert.fontStyle || "serif",
          };
          // Effective design: course's own uploaded design wins; else the org's uploaded
          // template; else the generated template below.
          let designUrl = "";
          let designType = "image";
          if (base.mode === "upload" && base.designUrl) {
            designUrl = base.designUrl;
            designType = base.designType || "image";
          } else if (orgCert.templateUrl) {
            designUrl = orgCert.templateUrl;
            designType = orgCert.templateType || "image";
          }
          const isUpload = !!designUrl;
          const designSrc = toAbsoluteUrl(designUrl);
          certCfg.designType = designType;

          // Owner-uploaded design (static, shown as-is to every recipient).
          if (isUpload) {
            return (
              <>
                {certCfg.designType === "pdf" ? (
                  <div className="rounded-xl border border-brand-border overflow-hidden bg-canvas">
                    <iframe src={designSrc} title="Certificate" className="block w-full" style={{ height: "80vh", minHeight: 600 }} />
                  </div>
                ) : (
                  <div id="cert-print" className="rounded-xl border border-brand-border overflow-hidden bg-white">
                    <img src={designSrc} alt="Certificate" className="block w-full" />
                  </div>
                )}
                <div className="no-print flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCert(null)}>Close</Button>
                  {certCfg.designType === "pdf" ? (
                    <a href={designSrc} target="_blank" rel="noreferrer" download>
                      <Button variant="primary" size="sm" leadingIcon={<i className="fa-solid fa-download text-xs" />}>
                        Download PDF
                      </Button>
                    </a>
                  ) : (
                    <Button variant="primary" size="sm" leadingIcon={<i className="fa-solid fa-download text-xs" />} onClick={handlePrint}>
                      Print / Save PDF
                    </Button>
                  )}
                </div>
              </>
            );
          }

          return (
            <>
            <div
              id="cert-print"
              className="relative overflow-hidden bg-gradient-to-b from-emerald-muted/40 to-surface rounded-xl p-8 border border-brand-border"
              style={{ fontFamily: CERT_FONTS[certCfg.fontStyle] || CERT_FONTS.serif }}
            >
              <div className="text-center mb-6">
                <img src={certCfg.logoUrl || "/images/title-img.png"} alt="seal" className="h-16 mx-auto mb-4" />
                <h3 className="text-caption font-bold text-brand-muted uppercase tracking-widest mb-4">
                  {certCfg.title || "Certificate of Completion"}
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
                <h3 className="text-subheading mb-4" style={{ color: certCfg.primaryColor }}>
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

              {certCfg.signatoryName && (
                <div className="text-center mb-4">
                  <div className="h-px w-40 bg-brand-border mb-1 mx-auto" />
                  <p className="text-caption font-semibold text-brand-text">{certCfg.signatoryName}</p>
                  {certCfg.signatoryRole && (
                    <p className="text-[10px] text-brand-muted">{certCfg.signatoryRole}</p>
                  )}
                </div>
              )}

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
          );
        })()}
      </Modal>
    </div>
  );
}
