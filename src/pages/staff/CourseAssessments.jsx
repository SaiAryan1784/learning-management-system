import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  SkeletonCard,
} from "../../components/ui";

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

  const toneByStatus = (status) => {
    if (status === "passed") return "success";
    if (status === "failed") return "danger";
    if (status === "started") return "warning";
    return "neutral";
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Course Assessments" subtitle="Complete quizzes & practical evaluations" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<i className="fa-solid fa-clipboard-question" />}
            title="No assessments available"
            description="This course does not have any quizzes or evaluations yet."
          />
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-3"
        >
          {assessments.map((assessment) => {
            const meta = getAssessmentMeta(assessment);
            const canStart =
              !assessment.isCourseEmbedded &&
              meta.status !== "passed" &&
              assessment.attempts.length < assessment.maxAttempts;
            return (
              <motion.div
                key={`${assessment._id}-${assessment.source}`}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card interactive className="!p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge tone={assessment.type === "quiz" ? "success" : "neutral"} size="sm">
                          {assessment.type}
                        </Badge>
                        <h3 className="text-body font-semibold text-brand-text">{assessment.title}</h3>
                      </div>
                      <p className="text-caption text-brand-muted">{assessment.description}</p>
                    </div>
                    <Badge tone={toneByStatus(meta.status)} dot>
                      {meta.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-caption text-brand-muted mb-4 flex-wrap">
                    {meta.score !== null && (
                      <span>
                        Score: <strong className="text-brand-text">{meta.score}%</strong>
                      </span>
                    )}
                    <span>
                      Attempts:{" "}
                      <strong className="text-brand-text">
                        {assessment.attempts.length} / {assessment.maxAttempts}
                      </strong>
                    </span>
                    <span>
                      Pass: <strong className="text-brand-text">{assessment.passPercent}%</strong>
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {canStart && (
                      <Button
                        variant="primary"
                        size="sm"
                        leadingIcon={<i className="fa-solid fa-play text-[10px]" />}
                        onClick={() =>
                          navigate(`/dashboard/staff/assessment/${assessment._id}/${courseId}`)
                        }
                      >
                        {assessment.attempts.length > 0 ? "Retry" : "Start"}
                      </Button>
                    )}
                    {meta.status === "passed" && assessment.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        leadingIcon={<i className="fa-solid fa-download text-[10px]" />}
                        onClick={() => window.open(assessment.certificateUrl, "_blank")}
                      >
                        Download Certificate
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
