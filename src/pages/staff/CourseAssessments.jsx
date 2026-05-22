import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageLoader } from "../../components/ui/Spinner";

export default function CourseAssessments() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const [assessmentRes, courseRes] = await Promise.all([
        api.get(`/assessments?course=${courseId}`),
        api.get("/courses"),
      ]);
      const separate = assessmentRes.data.assessments || [];
      const course = courseRes.data.courses.find((c) => c._id === courseId);
      const courseBased = course?.assessments || [];

      const normalize = (a, index, source) => ({
        _id: a._id || `${source}-${index}`,
        type: a.type, title: a.title, description: a.description,
        questions: a.questions || [], practicalInstructions: a.practicalInstructions || "",
        maxAttempts: a.maxAttempts || 3, passPercent: a.passPercent || 70,
        isCourseEmbedded: !a._id, source,
      });

      const merged = [
        ...separate.map((a, i) => normalize(a, i, "api")),
        ...courseBased.map((a, i) => normalize(a, i, "course")),
      ];
      const uniqueMap = new Map();
      merged.forEach((a) => { const key = `${a._id}-${a.source}`; if (!uniqueMap.has(key)) uniqueMap.set(key, a); });
      const unique = Array.from(uniqueMap.values());

      const enriched = await Promise.all(
        unique.map(async (assessment) => {
          if (assessment.isCourseEmbedded) return { ...assessment, attempts: [], certificateUrl: null };
          try {
            const resultRes = await api.get(`/assessments/${assessment._id}/results/me`, { params: { t: Date.now() } });
            return { ...assessment, attempts: resultRes.data.attempts || [], certificateUrl: resultRes.data.certificateUrl || null };
          } catch {
            return { ...assessment, attempts: [], certificateUrl: null };
          }
        })
      );
      setAssessments(enriched);
    } catch (err) {
      console.error("Assessment load failed", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const getAssessmentMeta = (assessment) => {
    const attempts = assessment.attempts || [];
    if (!attempts.length) return { status: "not-started", label: "Not Started", score: null, isPassed: false };
    const latest = [...attempts].sort((a, b) => b.attemptNo - a.attemptNo)[0];
    const isPassed = latest.status === "passed" || (latest.score !== null && latest.score >= assessment.passPercent);
    return {
      status: isPassed ? "passed" : latest.status,
      label: isPassed ? "Passed" : latest.status === "failed" ? "Failed" : latest.status === "started" ? "In Progress" : "Not Started",
      score: latest.score ?? null,
      isPassed,
    };
  };

  const statusBadge = (status) => {
    const map = {
      passed: "bg-emerald/10 text-emerald",
      failed: "bg-brand-danger/10 text-brand-danger",
      started: "bg-amber-50 text-amber-600",
    };
    return map[status] || "bg-brand-muted/10 text-brand-muted";
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <PageHeader title="Course Assessments" subtitle="Complete quizzes & practical evaluations" />

      {assessments.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-clipboard-question text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No assessments available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => {
            const meta = getAssessmentMeta(assessment);
            return (
              <div
                key={`${assessment._id}-${assessment.source}`}
                className="bg-surface border border-brand-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${assessment.type === "quiz" ? "bg-emerald/10 text-emerald" : "bg-brand-muted/10 text-brand-muted"}`}>
                        {assessment.type}
                      </span>
                      <h3 className="text-sm font-semibold text-brand-text">{assessment.title}</h3>
                    </div>
                    <p className="text-xs text-brand-muted">{assessment.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge(meta.status)}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-brand-muted mb-4">
                  {meta.score !== null && <span>Score: <strong className="text-brand-text">{meta.score}%</strong></span>}
                  <span>Attempts: <strong className="text-brand-text">{assessment.attempts.length} / {assessment.maxAttempts}</strong></span>
                  <span>Pass: <strong className="text-brand-text">{assessment.passPercent}%</strong></span>
                </div>

                <div className="flex gap-2">
                  {!assessment.isCourseEmbedded && meta.status !== "passed" && assessment.attempts.length < assessment.maxAttempts && (
                    <button
                      className="bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
                      onClick={() => navigate(`/dashboard/staff/assessment/${assessment._id}/${courseId}`)}
                    >
                      <i className="fa-solid fa-play text-[10px] mr-1.5"></i>
                      {assessment.attempts.length > 0 ? "Retry" : "Start"}
                    </button>
                  )}
                  {meta.status === "passed" && assessment.certificateUrl && (
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald border border-emerald/30 bg-emerald/5 hover:bg-emerald hover:text-white px-4 py-2 rounded-lg transition-colors"
                      onClick={() => window.open(assessment.certificateUrl, "_blank")}
                    >
                      <i className="fa-solid fa-download text-[10px]"></i> Download Certificate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
