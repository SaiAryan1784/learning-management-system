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
            const results = await Promise.all(
              assessments.map((a) => api.get(`/assessments/${a._id}/results/me`))
            );
            const hasPassed = results.some((r) =>
              (r.data.attempts || []).some((a) => a.status === "passed")
            );
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

  useEffect(() => {
    loadCertificates();
  }, []);

  const eligibleCertificates = certificates.filter((cert) => {
    const course = coursesProgress.find((c) => c.courseId === cert.course?._id);
    return course && course.progressPercent === 100 && cert.hasPassed;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="My Certificates" subtitle="Certificates earned from completed courses" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : eligibleCertificates.length === 0 ? (
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
          {eligibleCertificates.map((cert) => (
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
                  View Certificate
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
          <div className="relative overflow-hidden bg-gradient-to-b from-emerald-muted/40 to-surface rounded-xl p-8 -m-2">
            <div className="text-center mb-6">
              <img src="/images/title-img.png" alt="seal" className="h-16 mx-auto mb-4" />
              <h3 className="text-caption font-bold text-brand-muted uppercase tracking-widest mb-4">
                Certificate of Completion
              </h3>
              <div className="h-px bg-brand-border mb-4" />
              <p className="text-caption text-brand-muted uppercase tracking-wider mb-2">
                This certifies that
              </p>
              <h2 className="text-display text-brand-text mb-1">{selectedCert.staff?.name}</h2>
              <p className="text-caption text-brand-muted uppercase tracking-wider mb-2">
                has successfully completed
              </p>
              <h3 className="text-subheading text-emerald-hover mb-4">
                {selectedCert.course?.title}
              </h3>
              <div className="h-px bg-brand-border mb-4" />
              <p className="text-caption text-brand-muted mb-6">
                Congratulations! This is to certify that you have successfully completed the
                owner's onboarding training.
              </p>
            </div>

            <div className="flex items-center justify-between px-4">
              <div className="text-center">
                <div className="h-px w-24 bg-brand-border mb-1 mx-auto" />
                <p className="text-caption font-semibold text-brand-text">Nick Beghtol</p>
                <p className="text-[10px] text-brand-muted">CEO</p>
              </div>
              <div className="text-center">
                <img src="/images/stamp.png" alt="stamp" className="h-12 mx-auto opacity-80" />
              </div>
              <div className="text-center">
                <div className="h-px w-24 bg-brand-border mb-1 mx-auto" />
                <p className="text-caption font-semibold text-brand-text">Bailey Ames</p>
                <p className="text-[10px] text-brand-muted">Co-Founder</p>
              </div>
            </div>

            <p className="text-center text-caption text-brand-muted mt-4">
              Date: {new Date(selectedCert.issuedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
