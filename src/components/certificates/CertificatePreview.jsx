import { toAbsoluteUrl } from "../../utils/fileUrl";

/**
 * One certificate, rendered the same way wherever it is shown.
 *
 * The learner's Recognition page and the admin's Certificates Admin page both
 * need to display an issued certificate, and both endpoints return the same
 * payload. Keeping two copies of this logic would let the admin's view drift
 * from what the recipient actually receives — the one thing a certificate must
 * never do.
 */

export const CERT_FONTS = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, sans-serif",
  mono: "'Courier New', monospace",
};

/**
 * Work out what this certificate should look like.
 *
 * `subject` is the normalised course-or-path the certificate was earned for,
 * so a path certificate uses the path's own design instead of blowing up on a
 * null `course`. Subject values override org-wide defaults; empty falls back.
 *
 * An uploaded design (the org's finished artwork, e.g. from Canva) always wins
 * over the generated template.
 */
export function resolveCertDesign(cert, orgCert = {}) {
  const base = cert?.subject?.certificate || cert?.course?.certificate || {};

  const certCfg = {
    title: base.title || orgCert.title || "Certificate of Completion",
    signatoryName: base.signatoryName || orgCert.signatoryName || "",
    signatoryRole: base.signatoryRole || orgCert.signatoryRole || "",
    logoUrl: base.logoUrl || orgCert.logoUrl || "",
    primaryColor: orgCert.primaryColor || "#10B981",
    fontStyle: orgCert.fontStyle || "serif",
  };

  let designUrl = "";
  let designType = "image";
  if (base.mode === "upload" && base.designUrl) {
    designUrl = base.designUrl;
    designType = base.designType || "image";
  } else if (orgCert.templateUrl) {
    designUrl = orgCert.templateUrl;
    designType = orgCert.templateType || "image";
  }

  return {
    certCfg,
    designSrc: toAbsoluteUrl(designUrl),
    designType,
    isUpload: Boolean(designUrl),
  };
}

/** Print CSS — exports only the certificate node, not the surrounding page. */
export function CertificatePrintStyles() {
  return (
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
  );
}

export default function CertificatePreview({ cert, orgCert = {} }) {
  if (!cert) return null;

  const { certCfg, designSrc, designType, isUpload } = resolveCertDesign(cert, orgCert);

  // Owner-uploaded design, shown as-is to every recipient.
  if (isUpload) {
    return designType === "pdf" ? (
      <div className="rounded-xl border border-brand-border overflow-hidden bg-canvas">
        <iframe
          src={designSrc}
          title="Certificate"
          className="block w-full"
          style={{ height: "80vh", minHeight: 600 }}
        />
      </div>
    ) : (
      <div id="cert-print" className="rounded-xl border border-brand-border overflow-hidden bg-white">
        <img src={designSrc} alt="Certificate" className="block w-full" />
      </div>
    );
  }

  return (
    <div
      id="cert-print"
      className="relative overflow-hidden bg-gradient-to-b from-emerald-muted/40 to-surface rounded-xl p-8 border border-brand-border"
      style={{ fontFamily: CERT_FONTS[certCfg.fontStyle] || CERT_FONTS.serif }}
    >
      <div className="text-center mb-6">
        <img
          src={certCfg.logoUrl ? toAbsoluteUrl(certCfg.logoUrl) : "/images/title-img.png"}
          alt="seal"
          className="h-16 mx-auto mb-4"
        />
        <h3 className="text-caption font-bold text-brand-muted uppercase tracking-widest mb-4">
          {certCfg.title}
        </h3>
        <div className="h-px bg-brand-border mb-4" />
        <p className="text-caption text-brand-muted uppercase tracking-wider mb-2">
          This certifies that
        </p>
        <h2 className="text-display text-brand-text mb-1">{cert.staff?.name || "—"}</h2>
        <p className="text-caption text-brand-muted uppercase tracking-wider mb-2">
          has successfully completed
        </p>
        <h3 className="text-subheading mb-4" style={{ color: certCfg.primaryColor }}>
          {cert.subject?.title || cert.course?.title}
        </h3>
        <div className="h-px bg-brand-border mb-4" />
        <p className="text-caption text-brand-muted mb-2">
          Issued on {new Date(cert.issuedAt).toLocaleDateString()}
          {cert.expiresAt ? ` · Valid until ${new Date(cert.expiresAt).toLocaleDateString()}` : ""}
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
        <p className="text-[10px] text-brand-muted uppercase tracking-wider">Certificate No.</p>
        <p className="text-caption font-semibold text-brand-text mb-1">{cert.certificateNo}</p>
        {cert.verificationCode && (
          <p className="text-[10px] text-brand-muted">
            Verification code: {cert.verificationCode}
          </p>
        )}
      </div>
    </div>
  );
}
