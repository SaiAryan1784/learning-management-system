import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageLoader } from "../../components/ui/Spinner";

export default function AssessmentAttempt() {
  const { assessmentId, courseId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const preventBack = () => window.history.pushState(null, "", window.location.href);
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

  useEffect(() => {
    const initialize = async () => {
      try {
        const [assessmentRes, courseRes] = await Promise.all([
          api.get(`/assessments?course=${courseId}`),
          api.get("/courses"),
        ]);
        const separate = assessmentRes.data.assessments || [];
        const course = courseRes.data.courses.find((c) => c._id === courseId);
        const courseBased = course?.assessments || [];

        let found = separate.find((a) => a._id === assessmentId);
        let isEmbedded = false;

        if (!found) {
          const index = courseBased.findIndex((_, i) => `course-${i + 1000}` === assessmentId);
          if (index !== -1) {
            found = { ...courseBased[index], _id: assessmentId, isCourseEmbedded: true };
            isEmbedded = true;
          }
        }

        if (!found) { toastr.error("Assessment not found"); return; }
        setAssessment(found);
        if (isEmbedded) return;

        const res = await api.get(`/assessments/${assessmentId}/results/me`, { params: { t: Date.now() } });
        const latest = res.data.attempts.sort((a, b) => b.attemptNo - a.attemptNo)[0];
        if (latest && latest.status === "started") setAttempt(latest);
      } catch (err) {
        console.error(err);
        toastr.error("Error loading assessment");
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const startAttempt = async () => {
    const res = await api.post(`/assessments/${assessmentId}/attempts/start`);
    setAttempt(res.data.attempt);
  };

  const handleOption = (key) => setAnswers((prev) => ({ ...prev, [currentQuestion]: [key] }));

  const handleSubmit = async () => {
    try {
      if (assessment.type === "practical") {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/assessments/${assessmentId}/practical/submit`, formData);
      } else {
        await api.post(`/assessments/${assessmentId}/attempts/${attempt._id}/submit`, {
          answers: Object.keys(answers).map((i) => ({
            questionIndex: Number(i),
            selectedOptionKeys: answers[i],
          })),
        });
      }
      toastr.success("Assessment submitted");
      navigate(-1);
    } catch {
      toastr.error("Submission failed");
    }
  };

  if (loading) return <PageLoader />;
  if (!assessment) return <p className="text-brand-muted text-sm p-6">No assessment found.</p>;

  if (assessment?.isCourseEmbedded) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-surface border border-brand-border rounded-xl p-8 text-center">
        <i className="fa-solid fa-lock text-brand-muted text-3xl mb-3 block"></i>
        <h3 className="text-base font-semibold text-brand-text mb-1">Assessment Not Available</h3>
        <p className="text-sm text-brand-muted">Please contact admin.</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-surface border border-brand-border rounded-xl p-8">
          <h2 className="text-lg font-semibold text-brand-text mb-1">Start Assessment</h2>
          <p className="text-sm text-brand-muted mb-6">You are about to begin the assessment. Make sure you are ready.</p>
          <div className="border border-brand-border rounded-xl p-5 mb-6">
            <h3 className="text-base font-semibold text-brand-text mb-1">{assessment.title}</h3>
            <p className="text-sm text-brand-muted">{assessment.description}</p>
          </div>
          <button
            className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
            onClick={startAttempt}
          >
            <i className="fa-solid fa-play text-xs mr-2"></i>
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  if (assessment.type === "practical") {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-surface border border-brand-border rounded-xl p-8">
          <h2 className="text-lg font-semibold text-brand-text mb-2">{assessment.title}</h2>
          <p className="text-sm text-brand-muted mb-6">Upload your practical submission file.</p>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Upload File</label>
            <input
              type="file"
              className="text-sm text-brand-muted"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <button
            className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
            onClick={handleSubmit}
          >
            Upload & Submit
          </button>
        </div>
      </div>
    );
  }

  const question = assessment.questions[currentQuestion];
  const total = assessment.questions.length;

  return (
    <div className="max-w-2xl mx-auto mt-6 select-none">
      <div className="bg-surface border border-brand-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-charcoal px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{assessment.title}</h2>
          <span className="text-xs font-semibold text-white/60 bg-charcoal-light rounded-lg px-3 py-1.5">
            {currentQuestion + 1} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-charcoal-light">
          <div
            className="h-full bg-emerald transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="px-6 py-6">
          <p className="text-sm font-semibold text-brand-text mb-5">
            {currentQuestion + 1}. {question.prompt}
          </p>
          <div className="space-y-2">
            {question.options.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                  answers[currentQuestion]?.includes(opt.key)
                    ? "border-emerald bg-emerald/5"
                    : "border-brand-border hover:border-emerald/40"
                }`}
              >
                <input
                  type="radio"
                  className="accent-emerald"
                  checked={answers[currentQuestion]?.includes(opt.key) || false}
                  onChange={() => handleOption(opt.key)}
                />
                <span className="text-sm text-brand-text">{opt.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
          <button
            className="px-4 py-2 text-sm font-semibold text-brand-muted border border-brand-border rounded-lg hover:bg-canvas transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion((prev) => prev - 1)}
          >
            <i className="fa-solid fa-arrow-left text-xs mr-1.5"></i> Previous
          </button>
          {currentQuestion < total - 1 ? (
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors"
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
            >
              Next <i className="fa-solid fa-arrow-right text-xs ml-1.5"></i>
            </button>
          ) : (
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors"
              onClick={handleSubmit}
            >
              <i className="fa-solid fa-check text-xs mr-1.5"></i> Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
