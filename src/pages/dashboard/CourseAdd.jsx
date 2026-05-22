import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageLoader } from "../../components/ui/Spinner";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

export default function CourseAdd() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", categoryIds: [], status: "draft", assessments: [],
  });
  const [openAssessments, setOpenAssessments] = useState({});
  const [openQuestions, setOpenQuestions] = useState({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/course-categories?active=true&page=1&limit=100");
        setCategories(res.data.categories || []);
      } catch {
        toastr.error("Failed to load categories");
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!courseId) return;
    const loadCourse = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}`);
        const data = res.data;
        setForm({
          title: data.title, description: data.description,
          categoryIds: data.categories?.map((c) => c._id) || [],
          status: data.status || "draft", assessments: data.assessments || [],
        });
        setEditId(data._id);
      } catch {
        toastr.error("Failed to load course");
      }
      setLoading(false);
    };
    loadCourse();
  }, [courseId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const addAssessment = (type) => {
    const newA = type === "quiz"
      ? { type: "quiz", title: "New Quiz", description: "", passPercent: 70, maxAttempts: 3, questions: [] }
      : { type: "practical", title: "New Practical", description: "", passPercent: 70, maxAttempts: 3, practicalInstructions: "" };
    setForm((prev) => ({ ...prev, assessments: [...prev.assessments, newA] }));
    setOpenAssessments((prev) => ({ ...prev, [form.assessments.length]: true }));
  };

  const toggleAssessmentOpen = (index) =>
    setOpenAssessments((prev) => ({ ...prev, [index]: !prev[index] }));

  const deleteAssessment = (index) => {
    setForm((prev) => {
      const a = [...prev.assessments];
      a.splice(index, 1);
      return { ...prev, assessments: a };
    });
  };

  const updateAssessment = (index, field, value) => {
    const a = [...form.assessments];
    a[index][field] = value;
    setForm((prev) => ({ ...prev, assessments: a }));
  };

  const addQuizQuestion = (aIndex) => {
    const a = [...form.assessments];
    a[aIndex].questions.push({ prompt: "", options: [], correctOptionKeys: [] });
    setForm((prev) => ({ ...prev, assessments: a }));
    setOpenQuestions((prev) => ({ ...prev, [`${aIndex}-${a[aIndex].questions.length - 1}`]: true }));
  };

  const toggleQuestionOpen = (aIndex, qIndex) => {
    const key = `${aIndex}-${qIndex}`;
    setOpenQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateQuizQuestion = (aIndex, qIndex, field, value) => {
    const a = [...form.assessments];
    a[aIndex].questions[qIndex][field] = value;
    setForm((prev) => ({ ...prev, assessments: a }));
  };

  const addQuizOption = (aIndex, qIndex) => {
    const a = [...form.assessments];
    const options = a[aIndex].questions[qIndex].options;
    options.push({ key: String.fromCharCode(65 + options.length), text: "" });
    setForm((prev) => ({ ...prev, assessments: a }));
  };

  const updateQuizOption = (aIndex, qIndex, oIndex, value) => {
    const a = [...form.assessments];
    a[aIndex].questions[qIndex].options[oIndex].text = value;
    setForm((prev) => ({ ...prev, assessments: a }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toastr.error("Title is required");
    if (!form.categoryIds.length) return toastr.error("Select at least one category");
    try {
      let res;
      if (editId) {
        res = await api.put(`/courses/${editId}`, form);
        toastr.success("Course updated");
      } else {
        res = await api.post("/courses", form);
        toastr.success("Course created");
      }
      if (form.status === "published") {
        await api.patch(`/courses/${editId || res.data._id}/publish`);
        toastr.success("Course published");
      }
      navigate("/dashboard/courses");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <PageHeader title={editId ? "Edit Course" : "Add Course"} subtitle="Create or update a course with assessments">
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
          onClick={() => navigate("/dashboard/courses")}
        >
          <i className="fa fa-arrow-left text-xs"></i>
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: basic info */}
          <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wide border-b border-brand-border pb-2">Course Info</h3>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Course Title</label>
              <input className={inputClass} type="text" name="title" value={form.title} onChange={handleChange} placeholder="Course title" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
              <textarea className={inputClass} rows={4} name="description" value={form.description} onChange={handleChange} placeholder="Course description" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Category</label>
              <select
                className={inputClass}
                value={form.categoryIds[0] || ""}
                onChange={(e) => setForm({ ...form, categoryIds: [e.target.value] })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Status</label>
              <select className={inputClass} name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <button
              className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
              type="submit"
            >
              {editId ? "Update Course" : "Create Course"}
            </button>
          </div>

          {/* Right: assessments */}
          <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-2">
              <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Assessments</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-emerald hover:text-emerald transition-colors"
                  onClick={() => addAssessment("quiz")}
                >
                  <FaPlus size={8} /> Quiz
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-emerald hover:text-emerald transition-colors"
                  onClick={() => addAssessment("practical")}
                >
                  <FaPlus size={8} /> Practical
                </button>
              </div>
            </div>

            {form.assessments.length === 0 && (
              <p className="text-brand-muted text-sm text-center py-6">No assessments added yet.</p>
            )}

            <div className="space-y-3">
              {form.assessments.map((a, ai) => (
                <div key={ai} className="border border-brand-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-canvas cursor-pointer"
                    onClick={() => toggleAssessmentOpen(ai)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${a.type === "quiz" ? "bg-emerald/10 text-emerald" : "bg-brand-muted/10 text-brand-muted"}`}>
                        {a.type}
                      </span>
                      <span className="text-sm font-medium text-brand-text">{a.title || "Untitled"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex items-center justify-center w-6 h-6 rounded text-brand-danger hover:bg-brand-danger/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); deleteAssessment(ai); }}
                      >
                        <FaTrash size={10} />
                      </button>
                      {openAssessments[ai] ? <FaChevronUp size={10} className="text-brand-muted" /> : <FaChevronDown size={10} className="text-brand-muted" />}
                    </div>
                  </div>

                  {openAssessments[ai] && (
                    <div className="px-4 py-4 border-t border-brand-border space-y-3">
                      <input className={inputClass} type="text" placeholder="Assessment Title" value={a.title} onChange={(e) => updateAssessment(ai, "title", e.target.value)} />
                      <textarea className={inputClass} rows={2} placeholder="Description" value={a.description} onChange={(e) => updateAssessment(ai, "description", e.target.value)} />

                      {a.type === "quiz" && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Questions</h5>
                          {a.questions.map((q, qi) => {
                            const key = `${ai}-${qi}`;
                            return (
                              <div key={qi} className="border border-brand-border rounded-lg overflow-hidden">
                                <div
                                  className="flex items-center justify-between px-3 py-2 bg-canvas cursor-pointer"
                                  onClick={() => toggleQuestionOpen(ai, qi)}
                                >
                                  <span className="text-xs text-brand-text font-medium">Q{qi + 1}: {q.prompt || "New Question"}</span>
                                  {openQuestions[key] ? <FaChevronUp size={9} className="text-brand-muted" /> : <FaChevronDown size={9} className="text-brand-muted" />}
                                </div>
                                {openQuestions[key] && (
                                  <div className="p-3 border-t border-brand-border space-y-2">
                                    <input className={inputClass} type="text" placeholder="Question prompt" value={q.prompt} onChange={(e) => updateQuizQuestion(ai, qi, "prompt", e.target.value)} />
                                    <div className="space-y-1.5">
                                      {q.options.map((o, oi) => (
                                        <input key={oi} className={inputClass} type="text" placeholder={`Option ${o.key}`} value={o.text} onChange={(e) => updateQuizOption(ai, qi, oi, e.target.value)} />
                                      ))}
                                      <button
                                        type="button"
                                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-emerald-hover transition-colors"
                                        onClick={() => addQuizOption(ai, qi)}
                                      >
                                        <FaPlus size={8} /> Add Option
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-emerald hover:text-emerald transition-colors"
                            onClick={() => addQuizQuestion(ai)}
                          >
                            <FaPlus size={8} /> Add Question
                          </button>
                        </div>
                      )}

                      {a.type === "practical" && (
                        <textarea
                          className={inputClass}
                          rows={3}
                          placeholder="Practical Instructions"
                          value={a.practicalInstructions}
                          onChange={(e) => updateAssessment(ai, "practicalInstructions", e.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
