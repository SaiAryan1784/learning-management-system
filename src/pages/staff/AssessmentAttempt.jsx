// src/pages/staff/AssessmentAttempt.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";

export default function AssessmentAttempt() {
  const { assessmentId, courseId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [file, setFile] = useState(null);

  /* -------------------- SECURITY LOCKS -------------------- */

  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);

    const preventCopy = (e) => e.preventDefault();
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", preventCopy);

    return () => {
      window.removeEventListener("popstate", preventBack);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("contextmenu", preventCopy);
    };
  }, []);

  /* -------------------- INITIALIZE -------------------- */

  useEffect(() => {
    const initialize = async () => {
      try {
        const listRes = await api.get(
          `/assessments?course=${courseId}`
        );

        const found = listRes.data.assessments.find(
          (a) => a._id === assessmentId
        );

        setAssessment(found);

        const res = await api.get(
          `/assessments/${assessmentId}/results/me`,
          { params: { t: Date.now() } }
        );

        const latest = res.data.attempts.sort(
          (a, b) => b.attemptNo - a.attemptNo
        )[0];

        if (latest && latest.status === "started") {
          setAttempt(latest);
        }

      } catch (err) {
        console.error(err);
        toastr.error("Error loading assessment");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  /* -------------------- ACTIONS -------------------- */

  const startAttempt = async () => {
    const res = await api.post(
      `/assessments/${assessmentId}/attempts/start`
    );
    setAttempt(res.data.attempt);
  };

  const handleOption = (key) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: [key],
    }));
  };

  const handleSubmit = async () => {
    try {
      if (assessment.type === "practical") {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(
          `/assessments/${assessmentId}/practical/submit`,
          formData
        );
      } else {
        await api.post(
          `/assessments/${assessmentId}/attempts/${attempt._id}/submit`,
          {
            answers: Object.keys(answers).map((i) => ({
              questionIndex: Number(i),
              selectedOptionKeys: answers[i],
            })),
          }
        );
      }

      toastr.success("Assessment submitted");
      navigate(-1);
    } catch {
      toastr.error("Submission failed");
    }
  };

  /* -------------------- UI -------------------- */

  if (loading) return <div>Loading...</div>;
  if (!assessment) return <div>No assessment found</div>;

  if (!attempt)
    return (
    < div className="mx-wd">
      <div className="dash-tp"><h1 className="wlc-tl">Start Assessment</h1></div>
      <div className="progress-item mt-4">
        <h2 className="progress-title mb-4">{assessment.title}</h2>
        <button className="rev-btn" onClick={startAttempt}>
          ▶ Start Assessment
        </button>
      </div>
      </div>
    );

  /* -------------------- PRACTICAL UI -------------------- */

  if (assessment.type === "practical")
    return (
      <div className="exam-container">
        <h2>{assessment.title}</h2>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button className="exam-btn" onClick={handleSubmit}>
          Upload & Submit
        </button>
      </div>
    );

  const question = assessment.questions[currentQuestion];

  return (
    <div className="exam-container">

      <div className="exam-header">
        <h2 className="sc-tl">{assessment.title}</h2>
      </div>

      <div className="question-card">
        <div className="question-text">
          {currentQuestion + 1}. {question.prompt}
        </div>

        <div className="options">
          {question.options.map((opt) => (
            <label key={opt.key} className="option-item">
              <input
                type="radio"
                checked={
                  answers[currentQuestion]?.includes(opt.key) ||
                  false
                }
                onChange={() => handleOption(opt.key)}
              />
              {opt.text}
            </label>
          ))}
        </div>
      </div>

      <div className="nav-buttons">
        <button
          className="exam-btn secondary"
          disabled={currentQuestion === 0}
          onClick={() =>
            setCurrentQuestion((prev) => prev - 1)
          }
        >
          ⬅ Previous
        </button>

        {currentQuestion <
        assessment.questions.length - 1 ? (
          <button
            className="exam-btn"
            onClick={() =>
              setCurrentQuestion((prev) => prev + 1)
            }
          >
            Next ➡
          </button>
        ) : (
          <button
            className="exam-btn"
            onClick={handleSubmit}
          >
            Submit ✔
          </button>
        )}
      </div>

      <style>{`
        .exam-container {
          background: #fff;
          padding: 20px;
          max-width: 900px;
          margin:20px auto;
          border-radius:8px;
          box-shadow: 0 0 14px 2px rgba(0,0,0,0.2);
        }

        .exam-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .question-text {
          font-weight:bold;
          font-size:14px;
        }

        .options {
          display:flex;
          flex-direction:column;
        }

        .exam-container .option-item {
          padding:12px 0;
          border:0;
          border-radius:0;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:10px;
        }
        .exam-container .question-card{background:transparent;box-shadow:unset;border-radius:0}
        .nav-buttons {
          display:flex;align-items:center;gap:20px;
        }

        .exam-btn {
          background:#059669;
          color:white;
          border:none;
          padding:10px 18px;
          border-radius:6px;
          cursor:pointer;
        }

        .exam-btn.secondary {
          background:#059669;
        }

        .exam-btn:disabled {
          opacity:0.6;
          cursor:not-allowed;
        }
      `}</style>

    </div>
  );
}