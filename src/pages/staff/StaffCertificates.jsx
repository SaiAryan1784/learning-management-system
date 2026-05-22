import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";

export default function StaffCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCertificates = async () => {
    try {
      const certRes = await api.get("/certificates/me");
      const certs = certRes.data.certificates || [];
      const dashRes = await api.get("/progress/me/dashboard");
      const courses = dashRes.data.courses || [];

      const enriched = await Promise.all(
        certs.map(async (cert) => {
          try {
            const res = await api.get(`/assessments?course=${cert.course?._id}`);
            const assessments = res.data.assessments || [];
            const results = await Promise.all(assessments.map((a) => api.get(`/assessments/${a._id}/results/me`)));
            const hasPassed = results.some((r) => (r.data.attempts || []).some((a) => a.status === "passed"));
            return { ...cert, hasPassed };
          } catch {
            return { ...cert, hasPassed: false };
          }
        })
      );
      setCertificates(enriched);
      setCoursesProgress(courses);
    } catch {
      toastr.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCertificates(); }, []);

  if (loading) return <p className="text-brand-muted text-sm p-6">Loading...</p>;

  const eligibleCertificates = certificates.filter((cert) => {
    const course = coursesProgress.find((c) => c.courseId === cert.course?._id);
    return course && course.progressPercent === 100 && cert.hasPassed;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="My Certificates" subtitle="Certificates earned from completed courses" />

      {eligibleCertificates.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-certificate text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-text font-semibold mb-1">No Certificates Yet</p>
          <p className="text-brand-muted text-sm">Complete all lessons and pass the final quiz to unlock your certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eligibleCertificates.map((cert) => (
            <div key={cert._id} className="bg-surface border border-brand-border rounded-xl p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-certificate text-sm text-emerald"></i>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-brand-text">{cert.course?.title}</h4>
                  <p className="text-xs text-brand-muted">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                className="mt-auto bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide py-2 rounded-lg transition-colors"
                onClick={() => setSelectedCert(cert)}
              >
                View Certificate
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 bg-charcoal/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedCert(null); }}
        >
          <div className="bg-surface rounded-2xl border border-brand-border w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h2 className="text-base font-semibold text-brand-text uppercase tracking-wide">Certificate</h2>
              <button
                className="w-7 h-7 rounded-md hover:bg-canvas text-brand-muted flex items-center justify-center"
                onClick={() => setSelectedCert(null)}
              >
                <i className="fa-solid fa-close text-xs"></i>
              </button>
            </div>

            {/* Certificate design */}
            <div className="p-8 relative overflow-hidden bg-gradient-to-b from-emerald/5 to-surface">
              <div className="text-center mb-6">
                <img src="/images/title-img.png" alt="seal" className="h-16 mx-auto mb-4" />
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-4">Certificate of Completion</h3>
                <div className="h-px bg-brand-border mb-4" />
                <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">This certifies that</p>
                <h2 className="text-2xl font-bold text-brand-text mb-1">{selectedCert.staff?.name}</h2>
                <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">has successfully completed</p>
                <h3 className="text-lg font-semibold text-emerald mb-4">{selectedCert.course?.title}</h3>
                <div className="h-px bg-brand-border mb-4" />
                <p className="text-xs text-brand-muted mb-6">
                  Congratulations! This is to certify that you have successfully completed the owner's onboarding training.
                </p>
              </div>

              <div className="flex items-center justify-between px-4">
                <div className="text-center">
                  <div className="h-px w-24 bg-brand-border mb-1 mx-auto" />
                  <p className="text-xs font-semibold text-brand-text">Nick Beghtol</p>
                  <p className="text-[10px] text-brand-muted">CEO</p>
                </div>
                <div className="text-center">
                  <img src="/images/stamp.png" alt="stamp" className="h-12 mx-auto opacity-80" />
                </div>
                <div className="text-center">
                  <div className="h-px w-24 bg-brand-border mb-1 mx-auto" />
                  <p className="text-xs font-semibold text-brand-text">Bailey Ames</p>
                  <p className="text-[10px] text-brand-muted">Co-Founder</p>
                </div>
              </div>

              <p className="text-center text-xs text-brand-muted mt-4">
                Date: {new Date(selectedCert.issuedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
