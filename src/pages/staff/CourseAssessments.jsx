import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import AOS from "aos";
import "aos/dist/aos.css";

export default function CourseAssessments() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);

      const [assessmentRes, courseRes] = await Promise.all([
        api.get(`/assessments?course=${courseId}`),
        api.get("/courses")
      ]);

      const separate = assessmentRes.data.assessments || [];

      const course = courseRes.data.courses.find(
        (c) => c._id === courseId
      );

      const courseBased = course?.assessments || [];

      /* 🔥 NORMALIZE */
      const normalize = (a, index, source) => ({
        _id: a._id || `${source}-${index}`,
        type: a.type,
        title: a.title,
        description: a.description,
        questions: a.questions || [],
        practicalInstructions: a.practicalInstructions || "",
        maxAttempts: a.maxAttempts || 3,
        passPercent: a.passPercent || 70,
        isCourseEmbedded: !a._id,
        source // 👈 IMPORTANT
      });

      const merged = [
        ...separate.map((a, i) => normalize(a, i, "api")),
        ...courseBased.map((a, i) => normalize(a, i, "course"))
      ];

      /* ❌ REMOVE DUPLICATES */
      const uniqueMap = new Map();

      merged.forEach((a) => {
        const key = `${a._id}-${a.source}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, a);
        }
      });

      const uniqueAssessments = Array.from(uniqueMap.values());

      /* 🔥 ENRICH */
      const enriched = await Promise.all(
        uniqueAssessments.map(async (assessment) => {
          if (assessment.isCourseEmbedded) {
            return {
              ...assessment,
              attempts: [],
              certificateUrl: null
            };
          }

          try {
            const resultRes = await api.get(
              `/assessments/${assessment._id}/results/me`,
              { params: { t: Date.now() } }
            );

            return {
              ...assessment,
              attempts: resultRes.data.attempts || [],
              certificateUrl: resultRes.data.certificateUrl || null
            };
          } catch {
            return {
              ...assessment,
              attempts: [],
              certificateUrl: null
            };
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

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    fetchAssessments();
  }, [fetchAssessments]);

  /* ================= STATUS ================= */

  const getAssessmentMeta = (assessment) => {
    const attempts = assessment.attempts || [];

    if (!attempts.length) {
      return {
        status: "not-started",
        label: "Not Started",
        score: null,
        lastDate: null,
        isPassed: false
      };
    }

    const latest = [...attempts].sort(
      (a, b) => b.attemptNo - a.attemptNo
    )[0];

    /* 🔥 FIX PASS LOGIC */
    const isPassed =
      latest.status === "passed" ||
      (latest.score !== null &&
        latest.score >= assessment.passPercent);

    return {
      status: isPassed ? "passed" : latest.status,
      label: isPassed
        ? "Passed"
        : latest.status === "failed"
        ? "Failed"
        : latest.status === "started"
        ? "In Progress"
        : "Not Started",
      score: latest.score ?? null,
      lastDate: latest.completedAt || latest.updatedAt || null,
      isPassed
    };
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "passed":
        return "pill success";
      case "failed":
        return "pill danger";
      case "started":
        return "pill warning";
      default:
        return "pill neutral";
    }
  };

  if (loading) {
    return <div className="mx-wd py-5">Loading assessments...</div>;
  }

  return (
    <div className="mx-wd">

      <div className="about-image-grid dash-tp">
        <div className="prof">
          <h3 className="prof-name">
            Course Assessments 🎯
          </h3>
          <p className="prof-em my-2">
            Complete quizzes & practical evaluations
          </p>
        </div>
      </div>

      {assessments.length > 0 && (
        <div className="align-items-center about-showcase">
          <div className="mx-wd col-lg-12 order-lg-1">
            <div className="about-content-box">

              <div className="prog-rw">

                {assessments.map((assessment) => {
                  const meta = getAssessmentMeta(assessment);

                  return (
                    <div
                      key={`${assessment._id}-${assessment.source}`}
                      className="progress-item py-4"
                      data-aos="fade-up"
                    >

                      <div className="d-flex justify-content-between">
                        <span className="progress-title">{assessment.title}</span>
                        <small className={getStatusClass(meta.status)}>
                          {meta.label}
                        </small>
                      </div>

                      <small className="text-muted d-block">
                        Type: {assessment.type.toUpperCase()}
                      </small>

                      {meta.score !== null && (
                        <p className="text-muted d-block">Score: {meta.score}%</p>
                      )}

                      <small className="text-muted d-block my-2">
                        Attempts: {assessment.attempts.length} /{" "}
                        {assessment.maxAttempts}
                      </small>

                      <div>

                        {!assessment.isCourseEmbedded &&
                          meta.status !== "passed" &&
                          assessment.attempts.length <
                            assessment.maxAttempts && (
                            <button className="rev-btn"
                              onClick={() =>
                                navigate(
                                  `/dashboard/staff/assessment/${assessment._id}/${courseId}`
                                )
                              }
                            >
                              Start
                            </button>
                        )}

                        {meta.status === "passed" &&
                          assessment.certificateUrl && (
                            <button className="rev-btn"
                              onClick={() =>
                                window.open(
                                  assessment.certificateUrl,
                                  "_blank"
                                )
                              }
                            >
                              Download Certificate
                            </button>
                        )}

                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}