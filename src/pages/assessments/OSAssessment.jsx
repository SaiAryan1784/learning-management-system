import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

export default function OSAssessment() {
  const [assessments, setAssessments] = useState([]);
  const [activeTab, setActiveTab] = useState("add");
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "quiz",
    passPercentage: 70,
    maxAttempts: 3,
    questions: [],
    practical: {
      instructions: "",
      criteria: "",
      maxMarks: 100,
      requireFileUpload: true
    }
  });

  /* ================= LOAD ================= */

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

  useEffect(() => {
    loadAssessments();
  }, []);

  /* ================= QUIZ LOGIC ================= */

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          prompt: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ]
        }
      ]
    });
  };

  const deleteQuestion = (index) => {
    const updated = [...form.questions];
    updated.splice(index, 1);
    setForm({ ...form, questions: updated });
  };

  const addOption = (qIndex) => {
    const updated = [...form.questions];
    updated[qIndex].options.push({
      text: "",
      isCorrect: false
    });
    setForm({ ...form, questions: updated });
  };

  const deleteOption = (qIndex, oIndex) => {
    const updated = [...form.questions];
    updated[qIndex].options.splice(oIndex, 1);
    setForm({ ...form, questions: updated });
  };

  const setCorrectOption = (qIndex, oIndex) => {
    const updated = [...form.questions];
    updated[qIndex].options =
      updated[qIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === oIndex
      }));
    setForm({ ...form, questions: updated });
  };

  const validateQuiz = () => {
    if (form.type !== "quiz") return true;
    if (form.questions.length === 0) {
      toastr.warning("Add at least one question");
      return false;
    }
    for (let q of form.questions) {
      if (!q.options.some(o => o.isCorrect)) {
        toastr.error("Each question must have one correct answer");
        return false;
      }
    }
    return true;
  };

  /* ================= SAVE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateQuiz()) return;

    const payload = {
      title: form.title,
      type: form.type,
      passPercentage: Number(form.passPercentage),
      maxAttempts: Number(form.maxAttempts),
      questions: form.type === "quiz" ? form.questions : [],
      practical: form.type === "practical" ? form.practical : null
    };

    try {
      if (editId) {
        await api.put(`/assessments/${editId}`, payload);
        toastr.success("Assessment updated");
      } else {
        await api.post("/assessments", payload);
        toastr.success("Assessment created");
      }

      setForm({
        title: "",
        type: "quiz",
        passPercentage: 70,
        maxAttempts: 3,
        questions: [],
        practical: {
          instructions: "",
          criteria: "",
          maxMarks: 100,
          requireFileUpload: true
        }
      });

      setEditId(null);
      setExpanded(null);
      loadAssessments();
      setActiveTab("list");
    } catch {
      toastr.error("Save failed");
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title,
      type: item.type,
      passPercentage: item.passPercentage,
      maxAttempts: item.maxAttempts,
      questions: item.questions || [],
      practical: item.practical || {
        instructions: "",
        criteria: "",
        maxMarks: 100,
        requireFileUpload: true
      }
    });
    setActiveTab("add");
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">ASSESSMENTS</h1>
        <p className="wlc-ms">Manage assessments professionally.</p>
      </div>

      <div className="pg-tabs">
        <span className={`pg-tb ${activeTab === "add" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("add")}>Add Assessment</span>
        <span className={`pg-tb ${activeTab === "list" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("list")}>Assessment List</span>
      </div>

      <div className="tab-content os-assess">

        {activeTab === "add" && (
          <div className="saas-container">
            <div className="saas-card">
              <div className="saas-header">
                <h2>{editId ? "Edit Assessment" : "Create Assessment"}</h2>
              </div>

              <form onSubmit={handleSubmit} className="saas-form">

                {/* BASIC INFO */}
                <div className="form-section">
                  <h4>Basic Information</h4>
                  <div className="form-row">

                    <div className="form-group modern-input">
                      <label>Title</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group modern-input">
                      <label>Type</label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            type: e.target.value,
                            questions: []
                          })
                        }
                        className="modern-select"
                      >
                        <option value="quiz">Quiz</option>
                        <option value="practical">Practical</option>
                      </select>
                    </div>

                    <div className="form-group modern-input">
                      <label>Pass %</label>
                      <input
                        type="number"
                        value={form.passPercentage}
                        onChange={(e) =>
                          setForm({ ...form, passPercentage: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group modern-input">
                      <label>Max Attempts</label>
                      <input
                        type="number"
                        value={form.maxAttempts}
                        onChange={(e) =>
                          setForm({ ...form, maxAttempts: e.target.value })
                        }
                      />
                    </div>

                  </div>
                </div>

                {/* QUIZ BUILDER */}
                {form.type === "quiz" && (
                  <div className="form-section">
                    <h4>Quiz Questions</h4>

                    {form.questions.map((q, qIndex) => (
                      <div key={qIndex} className="question-card">
                        <div
                          className="question-header"
                          onClick={() =>
                            setExpanded(expanded === qIndex ? null : qIndex)
                          }
                        >
                          <span className={`arrow ${expanded === qIndex ? "rotate" : ""}`}>▶</span>
                          Question {qIndex + 1}
                        </div>

                        {expanded === qIndex && (
                          <div className="question-body">
                            <input
                              type="text"
                              className="question-input"
                              placeholder="Enter question..."
                              value={q.prompt}
                              onChange={(e) => {
                                const updated = [...form.questions];
                                updated[qIndex].prompt = e.target.value;
                                setForm({ ...form, questions: updated });
                              }}
                            />

                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="option-card">
                                <input
                                  type="radio"
                                  checked={opt.isCorrect}
                                  onChange={() =>
                                    setCorrectOption(qIndex, oIndex)
                                  }
                                />
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updated = [...form.questions];
                                    updated[qIndex].options[oIndex].text =
                                      e.target.value;
                                    setForm({ ...form, questions: updated });
                                  }}
                                />
                              </div>
                            ))}

                            <button
                              type="button"
                              className="add-option-btn"
                              onClick={() => addOption(qIndex)}
                            >
                              + Add Option
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-question-btn"
                      onClick={addQuestion}
                    >
                      + Add Question
                    </button>
                  </div>
                )}

                {/* PRACTICAL BUILDER */}
                {form.type === "practical" && (
                  <div className="form-section">
                    <h4>Practical Details</h4>

                    <div className="form-group modern-input">
                      <label>Instructions</label>
                      <textarea
                        rows="4"
                        value={form.practical.instructions}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            practical: {
                              ...form.practical,
                              instructions: e.target.value
                            }
                          })
                        }
                      />
                    </div>

                    <div className="form-group modern-input">
                      <label>Evaluation Criteria</label>
                      <textarea
                        rows="4"
                        value={form.practical.criteria}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            practical: {
                              ...form.practical,
                              criteria: e.target.value
                            }
                          })
                        }
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group modern-input">
                        <label>Max Marks</label>
                        <input
                          type="number"
                          value={form.practical.maxMarks}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              practical: {
                                ...form.practical,
                                maxMarks: e.target.value
                              }
                            })
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={form.practical.requireFileUpload}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                practical: {
                                  ...form.practical,
                                  requireFileUpload: e.target.checked
                                }
                              })
                            }
                          />
                          Require File Upload
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-footer">
                  <button type="submit" className="snd-btn">
                    {editId ? "Update Assessment" : "Create Assessment"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <div className="ls-tbl">
            {loading ? <p>Loading...</p> : (
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Pass %</th>
                    <th>Attempts</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(a => (
                    <tr key={a._id}>
                      <td>{a.title}</td>
                      <td>{a.type}</td>
                      <td>{a.passPercentage}</td>
                      <td>{a.maxAttempts}</td>
                      <td>
                        <span className="logout-btn edit-btn" onClick={() => handleEdit(a)}>
                            <i className="fa fa-edit"></i>
                            <span className="tooltiptext">Edit course</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}