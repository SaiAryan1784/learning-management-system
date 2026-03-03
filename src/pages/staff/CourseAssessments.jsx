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

      const res = await api.get(`/assessments?course=${courseId}`);
      const data = res.data.assessments || [];

      const enriched = await Promise.all(
        data.map(async (assessment) => {
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

  /* ================= STATUS LOGIC ================= */

  const getAssessmentMeta = (assessment) => {
    const attempts = assessment.attempts || [];

    if (!attempts.length) {
      return {
        status: "not-started",
        label: "Not Started",
        score: null,
        lastDate: null
      };
    }

    const latest = [...attempts].sort(
      (a, b) => b.attemptNo - a.attemptNo
    )[0];

    return {
      status: latest.status,
      label:
        latest.status === "passed"
          ? "Passed"
          : latest.status === "failed"
          ? "Failed"
          : latest.status === "started"
          ? "In Progress"
          : "Not Started",
      score: latest.score ?? null,
      lastDate: latest.completedAt || latest.updatedAt || null
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

      {/* HEADER */}
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

      {/* CARDS */}
      {assessments.length > 0 && (
      <div className="align-items-center about-showcase">
        <div className="mx-wd col-lg-12 order-lg-1">
          <div className="about-content-box">

            <div className="prog-rw">

              {assessments.map((assessment) => {
                const meta = getAssessmentMeta(assessment);

                return (
                  <div
                    key={assessment._id}
                    className="progress-item"
                    data-aos="fade-up"
                  >

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="progress-title">
                        {assessment.title}
                      </span>

                      <span className={getStatusClass(meta.status)}>
                        {meta.label}
                      </span>
                    </div>

                    <small className="text-muted d-block mb-2">
                      Type: {assessment.type.toUpperCase()}
                    </small>

                    {meta.score !== null && (
                      <div className="prg-cm">
                        <p>Latest Score</p>
                        <span className="progress-percent">
                          {meta.score}%
                        </span>
                      </div>
                    )}

                    {meta.lastDate && (
                      <small className="text-muted d-block mb-2">
                        Last Attempt:{" "}
                        {new Date(meta.lastDate).toLocaleDateString()}
                      </small>
                    )}

                    <small className="text-muted d-block mb-3">
                      Attempts Used:{" "}
                      {assessment.attempts.length} /{" "}
                      {assessment.maxAttempts}
                    </small>

                    <div className="btn-fx">

                      {meta.status !== "passed" &&
                        assessment.attempts.length <
                          assessment.maxAttempts && (
                          <button
                            className="rev-btn"
                            onClick={() =>
                              navigate(`/dashboard/staff/assessment/${assessment._id}/${courseId}`)
                            }
                          >
                            {meta.status === "started"
                              ? "Resume"
                              : meta.status === "failed"
                              ? "Retry"
                              : "Start"}
                          </button>
                        )}

                      {meta.status === "passed" &&
                        assessment.certificateUrl && (
                          <button
                            className="rev-btn"
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