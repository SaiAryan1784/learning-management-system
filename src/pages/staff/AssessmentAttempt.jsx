import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { PageLoader } from "../../components/ui/Spinner";
import { Button, Card, Modal, Badge, EmptyState } from "../../components/ui";

export default function AssessmentAttempt() {
  const { assessmentId, courseId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [direction, setDirection] = useState(1);
  const [file, setFile] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    try {
      setStarting(true);
      const res = await api.post(`/assessments/${assessmentId}/attempts/start`);
      setAttempt(res.data.attempt);
    } catch (err) {
      console.error(err);
      toastr.error("Could not start assessment");
    } finally {
      setStarting(false);
    }
  };

  const handleOption = (key) => setAnswers((prev) => ({ ...prev, [currentQuestion]: [key] }));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!assessment) return <p className="text-brand-muted text-body p-6">No assessment found.</p>;

  if (assessment?.isCourseEmbedded) {
    return (
      <Card className="max-w-lg mx-auto mt-10" padded={false}>
        <EmptyState
          icon={<i className="fa-solid fa-lock" />}
          title="Assessment Not Available"
          description="Please contact admin to enable this assessment."
        />
      </Card>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <Card padded className="!p-8">
          <h2 className="text-heading text-brand-text mb-1">Start Assessment</h2>
          <p className="text-body text-brand-muted mb-6">
            You are about to begin the assessment. Make sure you are ready — once you start, the
            attempt is recorded.
          </p>
          <div className="border border-brand-border rounded-xl p-5 mb-6 bg-canvas">
            <h3 className="text-subheading text-brand-text mb-1">{assessment.title}</h3>
            <p className="text-body text-brand-muted">{assessment.description}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={starting}
            leadingIcon={<i className="fa-solid fa-play text-xs" />}
            onClick={startAttempt}
          >
            Start Assessment
          </Button>
        </Card>
      </div>
    );
  }

  if (assessment.type === "practical") {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <Card padded className="!p-8">
          <h2 className="text-heading text-brand-text mb-2">{assessment.title}</h2>
          <p className="text-body text-brand-muted mb-6">Upload your practical submission file.</p>
          <div className="mb-6">
            <label className="block text-caption font-semibold text-brand-muted uppercase tracking-wide mb-2">
              Upload File
            </label>
            <input
              type="file"
              className="text-body text-brand-muted block w-full text-body file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald file:text-white file:font-semibold file:cursor-pointer hover:file:bg-emerald-hover"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={!file}
            loading={submitting}
            onClick={() => setConfirmOpen(true)}
          >
            Upload & Submit
          </Button>
        </Card>

        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirm submission"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={submitting} onClick={handleSubmit}>
                Confirm
              </Button>
            </>
          }
        >
          <p className="text-body text-brand-text">
            Are you sure you want to submit your file? You cannot edit after submission.
          </p>
        </Modal>
      </div>
    );
  }

  const question = assessment.questions[currentQuestion];
  const total = assessment.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto mt-6 select-none">
      <Card padded={false} className="overflow-hidden">
        <div className="bg-charcoal px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-subheading text-white">{assessment.title}</h2>
            <p className="text-caption text-white/60 mt-0.5">
              {answeredCount} of {total} answered
            </p>
          </div>
          <Badge tone="charcoal" size="lg" className="!bg-charcoal-light !text-white">
            {currentQuestion + 1} / {total}
          </Badge>
        </div>

        <div className="h-1 bg-charcoal-light">
          <motion.div
            className="h-full bg-emerald"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / total) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="px-6 py-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion}
              custom={direction}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-body font-semibold text-brand-text mb-5">
                {currentQuestion + 1}. {question.prompt}
              </p>
              <div className="space-y-2">
                {question.options.map((opt) => {
                  const selected = answers[currentQuestion]?.includes(opt.key);
                  return (
                    <motion.label
                      key={opt.key}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                        selected
                          ? "border-emerald bg-emerald-muted"
                          : "border-brand-border hover:border-emerald/40"
                      }`}
                    >
                      <input
                        type="radio"
                        className="accent-emerald"
                        checked={selected || false}
                        onChange={() => handleOption(opt.key)}
                      />
                      <span className="text-body text-brand-text">{opt.text}</span>
                    </motion.label>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={currentQuestion === 0}
            leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
            onClick={() => {
              setDirection(-1);
              setCurrentQuestion((p) => p - 1);
            }}
          >
            Previous
          </Button>
          {currentQuestion < total - 1 ? (
            <Button
              variant="primary"
              trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />}
              onClick={() => {
                setDirection(1);
                setCurrentQuestion((p) => p + 1);
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              leadingIcon={<i className="fa-solid fa-check text-xs" />}
              onClick={() => setConfirmOpen(true)}
            >
              Submit
            </Button>
          )}
        </div>
      </Card>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm submission"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              Submit answers
            </Button>
          </>
        }
      >
        <p className="text-body text-brand-text mb-2">
          You've answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
        </p>
        <p className="text-body text-brand-muted">
          Once submitted, you cannot change your answers.
        </p>
      </Modal>
    </div>
  );
}
