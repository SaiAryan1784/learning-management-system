import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function CourseAdd() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryIds: [],
    status: "draft",
    assessments: [],
  });

  const [openAssessments, setOpenAssessments] = useState({});
  const [openQuestions, setOpenQuestions] = useState({});

  /* ================= LOAD CATEGORIES ================= */
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

  /* ================= LOAD COURSE FOR EDIT ================= */
  useEffect(() => {
    if (!courseId) return;
    const loadCourse = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}`);
        const data = res.data;
        setForm({
          title: data.title,
          description: data.description,
          categoryIds: data.categories?.map(c => c._id) || [],
          status: data.status || "draft",
          assessments: data.assessments || [],
        });
        setEditId(data._id);
      } catch {
        toastr.error("Failed to load course");
      }
      setLoading(false);
    };
    loadCourse();
  }, [courseId]);

  /* ================= FORM HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleCategory = (catId) => {
    setForm(prev => {
      const updated = [...prev.categoryIds];
      if (updated.includes(catId)) updated.splice(updated.indexOf(catId), 1);
      else updated.push(catId);
      return { ...prev, categoryIds: updated };
    });
  };

  /* ================= ASSESSMENTS ================= */
  const addAssessment = (type) => {
    const newAssessment = type === "quiz"
      ? { type: "quiz", title: "New Quiz", description: "", passPercent: 70, maxAttempts: 3, questions: [] }
      : { type: "practical", title: "New Practical", description: "", passPercent: 70, maxAttempts: 3, practicalInstructions: "" };

    setForm(prev => ({ ...prev, assessments: [...prev.assessments, newAssessment] }));
    setOpenAssessments(prev => ({ ...prev, [form.assessments.length]: true }));
  };

  const toggleAssessmentOpen = (index) => {
    setOpenAssessments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const deleteAssessment = (index) => {
    setForm(prev => {
      const newAssessments = [...prev.assessments];
      newAssessments.splice(index, 1);
      return { ...prev, assessments: newAssessments };
    });
  };

  const updateAssessment = (index, field, value) => {
    const newAssessments = [...form.assessments];
    newAssessments[index][field] = value;
    setForm(prev => ({ ...prev, assessments: newAssessments }));
  };

  /* ================= QUIZ QUESTIONS ================= */
  const addQuizQuestion = (aIndex) => {
    const newAssessments = [...form.assessments];
    newAssessments[aIndex].questions.push({ prompt: "", options: [], correctOptionKeys: [] });
    setForm(prev => ({ ...prev, assessments: newAssessments }));
    setOpenQuestions(prev => ({ ...prev, [`${aIndex}-${newAssessments[aIndex].questions.length-1}`]: true }));
  };

  const toggleQuestionOpen = (aIndex, qIndex) => {
    const key = `${aIndex}-${qIndex}`;
    setOpenQuestions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateQuizQuestion = (aIndex, qIndex, field, value) => {
    const newAssessments = [...form.assessments];
    newAssessments[aIndex].questions[qIndex][field] = value;
    setForm(prev => ({ ...prev, assessments: newAssessments }));
  };

  const addQuizOption = (aIndex, qIndex) => {
    const newAssessments = [...form.assessments];
    const options = newAssessments[aIndex].questions[qIndex].options;
    options.push({ key: String.fromCharCode(65 + options.length), text: "" });
    setForm(prev => ({ ...prev, assessments: newAssessments }));
  };

  const updateQuizOption = (aIndex, qIndex, oIndex, value) => {
    const newAssessments = [...form.assessments];
    newAssessments[aIndex].questions[qIndex].options[oIndex].text = value;
    setForm(prev => ({ ...prev, assessments: newAssessments }));
  };

  /* ================= SUBMIT ================= */
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
        const courseIdToPublish = editId || res.data._id;
        await api.patch(`/courses/${courseIdToPublish}/publish`);
        toastr.success("Course published");
      }

      navigate("/dashboard/courses");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">{editId ? "Edit Course" : "Add Course"}</h1>
        <p className="wlc-ms">Create or update a course with assessments</p>
      </div>

      <div className="course-frm">
        <form onSubmit={handleSubmit} className="course-form row">

         <div className="col-md-6 col-lg-6">
                {/* ================= Title / Description ================= */}
            <div className="form-group">
                <label>Course Title</label>
                <input className="login-ip" type="text" name="title" value={form.title} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea className="login-ip" rows={4} name="description" value={form.description} onChange={handleChange} required />
            </div>

            {/* ================= Categories ================= */}
            <div className="form-group">
                <label>Select Category</label>

                <select className="login-ip"
                    name="categoryId"
                    value={form.categoryIds[0] || ""}
                    onChange={(e) =>
                    setForm({
                        ...form,
                        categoryIds: [e.target.value], // store as array (API expects array)
                    })
                    }
                >
                    <option value="">Select Category</option>

                    {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                        {c.name}
                    </option>
                    ))}
                </select>
            </div>

            {/* ================= Status ================= */}
            <div className="form-group">
                <label>Status</label>
                <select className="login-ip" name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                </select>
            </div>
         </div>

          {/* ================= Assessments ================= */}
          <div className="col-md-6 col-lg-6">
            <div className="form-group">
                <h3>Assessments & Practicals</h3>
                <div className="assessment-actions">
                <button type="button" onClick={() => addAssessment("quiz")} className="logout-btn"><FaPlus /> Add Quiz</button>
                <button type="button" onClick={() => addAssessment("practical")} className="logout-btn"><FaPlus /> Add Practical</button>
                </div>

                {form.assessments.map((a, ai) => (
                <div key={ai} className="assessment-card">
                    <div className="assessment-header" onClick={() => toggleAssessmentOpen(ai)}>
                    <h4>{a.type.toUpperCase()}: {a.title}</h4>
                    <div>
                        <button type="button" className="btn-delete" onClick={() => deleteAssessment(ai)}><FaTrash /></button>
                        {openAssessments[ai] ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    </div>

                    {openAssessments[ai] && (
                    <div className="assessment-body">
                        <input className="login-ip" type="text" placeholder="Title" value={a.title} onChange={(e) => updateAssessment(ai, "title", e.target.value)} />
                        <textarea className="login-ip" rows={2} placeholder="Description" value={a.description} onChange={(e) => updateAssessment(ai, "description", e.target.value)} />

                        {a.type === "quiz" && (
                        <div className="quiz-section">
                            <h5>Questions</h5>
                            {a.questions.map((q, qi) => {
                            const key = `${ai}-${qi}`;
                            return (
                                <div key={qi} className="quiz-question">
                                <div className="quiz-header" onClick={() => toggleQuestionOpen(ai, qi)}>
                                    <span>Question {qi+1}: {q.prompt || "New Question"}</span>
                                    {openQuestions[key] ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                                {openQuestions[key] && (
                                    <div className="quiz-body">
                                    <input className="login-ip" type="text" placeholder="Prompt" value={q.prompt} onChange={(e) => updateQuizQuestion(ai, qi, "prompt", e.target.value)} />
                                    <div className="quiz-options">
                                        {q.options.map((o, oi) => (
                                        <input className="login-ip" key={oi} type="text" placeholder={`Option ${o.key}`} value={o.text} onChange={(e) => updateQuizOption(ai, qi, oi, e.target.value)} />
                                        ))}
                                        <button type="button" className="logout-btn" onClick={() => addQuizOption(ai, qi)}><FaPlus /> Add Option</button>
                                    </div>
                                    </div>
                                )}
                                </div>
                            )
                            })}
                            <button type="button" className="logout-btn" onClick={() => addQuizQuestion(ai)}><FaPlus /> Add Question</button>
                        </div>
                        )}

                        {a.type === "practical" && (
                        <div className="practical-section">
                            <textarea className="login-ip" rows={3} placeholder="Practical Instructions" value={a.practicalInstructions} onChange={(e) => updateAssessment(ai, "practicalInstructions", e.target.value)} />
                        </div>
                        )}

                    </div>
                    )}
                </div>
                ))}
            </div>
          </div>
          <button className="snd-btn" type="submit">{editId ? "Update Course" : "Create Course"}</button>
        </form>
      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        .category-box { display:flex; flex-wrap:wrap; gap:10px; border:1px solid #ddd; padding:10px; border-radius:6px; max-height:200px; overflow-y:auto; }
        .category-label { display:flex; align-items:center; gap:5px; }
        .assessment-card { border:1px solid #ccc; border-radius:6px; margin-top:10px; }
        .assessment-header { display:flex; justify-content:space-between; padding:10px; background:#f3f3f3; cursor:pointer; align-items:center; }
        .assessment-body { padding:10px; background:#fafafa; }
        .quiz-section, .practical-section { margin-top:10px; }
        .quiz-question { border:1px dashed #aaa; padding:6px; margin-bottom:6px; border-radius:4px; }
        .quiz-header { display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:4px; background:#f9f9f9; }
        .quiz-body { padding:6px; }
        .quiz-options { display:flex; flex-direction:column; gap:4px; margin-top:4px; }
        .btn-add { background:#10b981; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; margin-top:4px; }
        .btn-add:hover { background:#059669; }
        .btn-delete { background:#ef4444; color:#fff; border:none; padding:4px 6px; border-radius:4px; cursor:pointer; margin-right:6px; }
        .btn-delete:hover { background:#dc2626; }
        .course-frm{background-color:#fff;border-radius:8px;box-shadow:rgba(0, 0, 0, 0.08) 0px 6px 12px -4px, rgba(0, 0, 0, 0.08) 0px 1px 2px 0px, rgba(0, 0, 0, 0.32) 0px 0px 1px 0px;padding:20px;margin-top:20px;}
        
        .assessment-actions{display:flex;align-items:center;gap:10px;margin-top:10px;}
        .course-form.row{padding:0 10px;}
      `}</style>
    </div>
  )
}