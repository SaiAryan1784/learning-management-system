import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { SectionLoader } from "../../components/ui/Spinner";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function OSAssessment() {
  const [assessments, setAssessments] = useState([]);
  const [activeTab, setActiveTab] = useState("add");
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "", type: "quiz", passPercentage: 70, maxAttempts: 3,
    questions: [],
    practical: { instructions: "", criteria: "", maxMarks: 100, requireFileUpload: true },
  });

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/assessments");
      setAssessments(res.data.assessments || []);
    } catch {
      toastr.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssessments(); }, []);

  const addQuestion = () =>
    setForm({ ...form, questions: [...form.questions, { prompt: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] }] });

  const deleteQuestion = (index) => {
    const updated = [...form.questions];
    updated.splice(index, 1);
    setForm({ ...form, questions: updated });
  };

  const addOption = (qIndex) => {
    const updated = [...form.questions];
    updated[qIndex].options.push({ text: "", isCorrect: false });
    setForm({ ...form, questions: updated });
  };

  const setCorrectOption = (qIndex, oIndex) => {
    const updated = [...form.questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({ ...opt, isCorrect: i === oIndex }));
    setForm({ ...form, questions: updated });
  };

  const validateQuiz = () => {
    if (form.type !== "quiz") return true;
    if (form.questions.length === 0) { toastr.warning("Add at least one question"); return false; }
    for (let q of form.questions) {
      if (!q.options.some((o) => o.isCorrect)) { toastr.error("Each question must have one correct answer"); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateQuiz()) return;
    const payload = {
      title: form.title, type: form.type,
      passPercentage: Number(form.passPercentage), maxAttempts: Number(form.maxAttempts),
      questions: form.type === "quiz" ? form.questions : [],
      practical: form.type === "practical" ? form.practical : null,
    };
    try {
      if (editId) {
        await api.put(`/assessments/${editId}`, payload);
        toastr.success("Assessment updated");
      } else {
        await api.post("/assessments", payload);
        toastr.success("Assessment created");
      }
      setForm({ title: "", type: "quiz", passPercentage: 70, maxAttempts: 3, questions: [], practical: { instructions: "", criteria: "", maxMarks: 100, requireFileUpload: true } });
      setEditId(null); setExpanded(null); loadAssessments(); setActiveTab("list");
    } catch {
      toastr.error("Save failed");
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title, type: item.type, passPercentage: item.passPercentage, maxAttempts: item.maxAttempts,
      questions: item.questions || [],
      practical: item.practical || { instructions: "", criteria: "", maxMarks: 100, requireFileUpload: true },
    });
    setActiveTab("add");
  };

  const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md border border-brand-border text-brand-muted hover:bg-emerald/10 hover:text-emerald hover:border-emerald transition-colors";

  return (
    <div className="space-y-5">
      <PageHeader title="Assessments" subtitle="Manage assessments professionally." />

      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {[{ key: "add", label: editId ? "Edit Assessment" : "Add Assessment" }, { key: "list", label: "Assessment List" }].map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === key ? "bg-charcoal text-white" : "text-brand-muted hover:text-brand-text"}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "add" && (
        <div className="bg-surface border border-brand-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div>
              <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wide border-b border-brand-border pb-2 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Title</label>
                  <input className={inputClass} type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assessment title" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Type</label>
                  <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, questions: [] })}>
                    <option value="quiz">Quiz</option>
                    <option value="practical">Practical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Pass %</label>
                  <input className={inputClass} type="number" value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Max Attempts</label>
                  <input className={inputClass} type="number" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Quiz builder */}
            {form.type === "quiz" && (
              <div>
                <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wide border-b border-brand-border pb-2 mb-4">Quiz Questions</h4>
                <div className="space-y-3">
                  {form.questions.map((q, qIndex) => (
                    <div key={qIndex} className="border border-brand-border rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-canvas cursor-pointer"
                        onClick={() => setExpanded(expanded === qIndex ? null : qIndex)}
                      >
                        <div className="flex items-center gap-2">
                          <i className={`fa-solid fa-chevron-${expanded === qIndex ? "up" : "down"} text-xs text-brand-muted`}></i>
                          <span className="text-sm font-medium text-brand-text">Question {qIndex + 1}</span>
                          {q.prompt && <span className="text-xs text-brand-muted truncate max-w-48">— {q.prompt}</span>}
                        </div>
                        <button
                          type="button"
                          className="w-6 h-6 flex items-center justify-center rounded text-brand-danger hover:bg-brand-danger/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); deleteQuestion(qIndex); }}
                        >
                          <i className="fa fa-trash text-[10px]"></i>
                        </button>
                      </div>
                      {expanded === qIndex && (
                        <div className="px-4 py-4 border-t border-brand-border space-y-3">
                          <input
                            className={inputClass}
                            type="text"
                            placeholder="Enter question prompt..."
                            value={q.prompt}
                            onChange={(e) => {
                              const updated = [...form.questions];
                              updated[qIndex].prompt = e.target.value;
                              setForm({ ...form, questions: updated });
                            }}
                          />
                          <div className="space-y-2">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  className="accent-emerald flex-shrink-0"
                                  checked={opt.isCorrect}
                                  onChange={() => setCorrectOption(qIndex, oIndex)}
                                />
                                <input
                                  className="flex-1 px-3 py-1.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
                                  type="text"
                                  value={opt.text}
                                  placeholder={`Option ${oIndex + 1}`}
                                  onChange={(e) => {
                                    const updated = [...form.questions];
                                    updated[qIndex].options[oIndex].text = e.target.value;
                                    setForm({ ...form, questions: updated });
                                  }}
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-emerald-hover mt-1 transition-colors"
                              onClick={() => addOption(qIndex)}
                            >
                              <i className="fa-solid fa-plus text-[10px]"></i> Add Option
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-emerald hover:text-emerald transition-colors"
                    onClick={addQuestion}
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i> Add Question
                  </button>
                </div>
              </div>
            )}

            {/* Practical builder */}
            {form.type === "practical" && (
              <div>
                <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wide border-b border-brand-border pb-2 mb-4">Practical Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Instructions</label>
                    <textarea className={inputClass} rows={4} value={form.practical.instructions} onChange={(e) => setForm({ ...form, practical: { ...form.practical, instructions: e.target.value } })} placeholder="Practical instructions..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Evaluation Criteria</label>
                    <textarea className={inputClass} rows={4} value={form.practical.criteria} onChange={(e) => setForm({ ...form, practical: { ...form.practical, criteria: e.target.value } })} placeholder="Evaluation criteria..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Max Marks</label>
                      <input className={inputClass} type="number" value={form.practical.maxMarks} onChange={(e) => setForm({ ...form, practical: { ...form.practical, maxMarks: e.target.value } })} />
                    </div>
                    <div className="flex items-center mt-6">
                      <label className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                        <input type="checkbox" className="accent-emerald w-3.5 h-3.5" checked={form.practical.requireFileUpload} onChange={(e) => setForm({ ...form, practical: { ...form.practical, requireFileUpload: e.target.checked } })} />
                        Require File Upload
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-brand-border">
              <button className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors" type="submit">
                {editId ? "Update Assessment" : "Create Assessment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "list" && (
        loading ? (
          <SectionLoader />
        ) : (
          <TableContainer>
            <table width="100%">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Pass %</th>
                  <th>Max Attempts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-brand-muted py-8">No assessments found</td></tr>
                )}
                {assessments.map((a) => (
                  <tr key={a._id}>
                    <td className="font-medium">{a.title}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${a.type === "quiz" ? "bg-emerald/10 text-emerald" : "bg-brand-muted/10 text-brand-muted"}`}>
                        {a.type}
                      </span>
                    </td>
                    <td>{a.passPercentage}%</td>
                    <td>{a.maxAttempts}</td>
                    <td>
                      <button className={actionBtn} onClick={() => handleEdit(a)} title="Edit">
                        <i className="fa fa-edit text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )
      )}
    </div>
  );
}
