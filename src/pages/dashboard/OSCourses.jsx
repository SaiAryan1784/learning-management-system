import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { FaPlus, FaTrash } from "react-icons/fa";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

const actionBtnHtml = (icon, cls, title) =>
  `<button class="${cls} action-icon-btn" title="${title}" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;border:1px solid #E5E7EB;color:#6B7280;background:transparent;cursor:pointer;margin-right:4px;">
    <i class="fa ${icon}" style="font-size:11px;"></i>
  </button>`;

export default function CourseManager() {
  const tableRef = useRef();
  const dtRef = useRef();

  const [view, setView] = useState("list");
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("published");
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

  /* LOAD */
  const loadCategories = async () => {
    try {
      const res = await api.get("/course-categories?active=true&page=1&limit=100");
      setCategories(res.data.categories || []);
    } catch {
      toastr.error("Error loading categories");
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get("/courses", { params: { t: Date.now() } });
      if (dtRef.current) {
        dtRef.current.destroy();
        dtRef.current = null;
      }
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Error loading courses");
    }
  };

  useEffect(() => {
    loadCategories();
    loadCourses();
  }, []);

  useEffect(() => {
    return () => {
      if (dtRef.current) {
        dtRef.current.destroy();
        dtRef.current = null;
      }
    };
  }, []);

  /* DATATABLE */
  useEffect(() => {
    if (view !== "list") return;

    const filtered = courses.filter((c) => c.status === activeTab);

    if (dtRef.current) {
      dtRef.current.clear().rows.add(filtered).draw();
      return;
    }

    dtRef.current = $(tableRef.current).DataTable({
      data: filtered,
      destroy: true,
      columns: [
        { data: "title" },
        { data: null, render: (d) => d.categories?.map((c) => c.name).join(", ") || "" },
        {
          data: "status",
          render: (d) =>
            `<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:${d === "published" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)"};color:${d === "published" ? "#10B981" : "#6B7280"};">${d}</span>`,
        },
        {
          data: null,
          orderable: false,
          render: (d) =>
            `<div style="display:flex;align-items:center;gap:4px;">
              ${actionBtnHtml("fa-edit", "edit-btn", "Edit")}
              ${d.status === "draft" ? actionBtnHtml("fa-check", "publish-btn", "Publish") : ""}
              ${actionBtnHtml("fa-book", "module-btn", "Modules")}
              ${actionBtnHtml("fa-user-plus", "assign-btn", "Assign")}
            </div>`,
        },
      ],
    });

    $(tableRef.current).off("click", ".edit-btn");
    $(tableRef.current).off("click", ".publish-btn");
    $(tableRef.current).off("click", ".module-btn");
    $(tableRef.current).off("click", ".assign-btn");

    $(tableRef.current).on("click", ".edit-btn", function () {
      const id = dtRef.current.row($(this).closest("tr")).data()._id;
      const rowData = courses.find((c) => c._id === id);

      if (dtRef.current) {
        dtRef.current.destroy();
        dtRef.current = null;
      }
      setOpenAssessments({});
      setOpenQuestions({});

      setForm({ title: "", description: "", categoryIds: [], status: "draft", assessments: [] });

      setTimeout(() => {
        const normalizedAssessments = (rowData.assessments || [])
          .filter((a) => a.active !== false)
          .map((a) => ({
            type: a.type,
            title: a.title,
            description: a.description || "",
            passPercent: a.passPercent || 70,
            maxAttempts: a.maxAttempts || 3,
            certificateValidityDays: 365,
            renewalWindowDays: 30,
            questions: (a.questions || []).map((q) => ({
              prompt: q.prompt,
              correctOptionKeys: q.correctOptionKeys || [],
              options: (q.options || []).map((o) => ({ key: o.key, text: o.text })),
            })),
            practicalInstructions: a.practicalInstructions || "",
          }));

        setEditId(rowData._id);
        setForm({
          title: rowData.title,
          description: rowData.description,
          categoryIds: rowData.categories?.map((c) => c._id) || [],
          status: rowData.status,
          assessments: normalizedAssessments,
        });
        setView("form");
      }, 0);
    });

    $(tableRef.current).on("click", ".publish-btn", async function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      try {
        await api.patch(`/courses/${rowData._id}/publish`);
        toastr.success("Published");
        loadCourses();
      } catch {
        toastr.error("Error publishing course");
      }
    });

    $(tableRef.current).on("click", ".module-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      window.location.href = `/dashboard/courses/${rowData._id}/modules`;
    });

    $(tableRef.current).on("click", ".assign-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      window.location.href = `/dashboard/courses/${rowData._id}/assign`;
    });
  }, [courses, activeTab, view]);

  /* FORM HELPERS */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const addAssessment = (type) => {
    const base = { type, title: "", description: "", passPercent: 70, maxAttempts: 3, certificateValidityDays: 365, renewalWindowDays: 30 };
    const newA = type === "quiz" ? { ...base, questions: [] } : { ...base, practicalInstructions: "" };
    setForm((prev) => ({ ...prev, assessments: [...prev.assessments, newA] }));
  };

  const updateAssessment = (i, field, value) => {
    const arr = [...form.assessments];
    arr[i][field] = value;
    setForm({ ...form, assessments: arr });
  };

  const deleteAssessment = (i) => {
    const arr = [...form.assessments];
    arr.splice(i, 1);
    setForm({ ...form, assessments: arr });
  };

  const addQuestion = (ai) => {
    const arr = [...form.assessments];
    arr[ai].questions.push({ prompt: "", options: [], correctOptionKeys: [] });
    setForm({ ...form, assessments: arr });
  };

  const addOption = (ai, qi) => {
    const arr = [...form.assessments];
    const key = String.fromCharCode(65 + arr[ai].questions[qi].options.length);
    arr[ai].questions[qi].options.push({ key, text: "" });
    setForm({ ...form, assessments: arr });
  };

  const preparePayload = () => ({
    title: form.title,
    description: form.description,
    categoryIds: form.categoryIds,
    isComplianceCourse: false,
    complianceType: null,
    assessments: form.assessments.map((a) => {
      const base = {
        type: a.type, title: a.title, description: a.description || "",
        passPercent: a.passPercent || 70, maxAttempts: a.maxAttempts || 3,
        certificateValidityDays: 365, renewalWindowDays: 30,
      };
      if (a.type === "quiz") return { ...base, questions: (a.questions || []).map((q) => ({ prompt: q.prompt, options: (q.options || []).map((o) => ({ key: o.key, text: o.text })), correctOptionKeys: q.correctOptionKeys || [] })) };
      if (a.type === "practical") return { ...base, practicalInstructions: a.practicalInstructions || "" };
      return base;
    }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = preparePayload();
      let res;
      if (editId) {
        res = await api.put(`/courses/${editId}`, payload);
        toastr.success("Course updated");
      } else {
        res = await api.post("/courses", payload);
        toastr.success("Course created");
      }
      if (!editId && form.status === "published") {
        await api.patch(`/courses/${res.data._id}/publish`);
      }
      console.log(JSON.stringify(payload, null, 2));
      setView("list");
      setEditId(null);
      setForm({ title: "", description: "", categoryIds: [], status: "draft", assessments: [] });
      loadCourses();
    } catch {
      toastr.error("Save failed");
    }
  };

  /* FORM VIEW */
  if (view === "form") {
    return (
      <div className="space-y-5">
        <PageHeader title={editId ? "Edit Course" : "Add Course"} subtitle="Create or update a course">
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
            onClick={() => setView("list")}
          >
            <i className="fa fa-arrow-left text-xs"></i>
          </button>
        </PageHeader>

        <form onSubmit={handleSubmit}>
          <div className="bg-surface border border-brand-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Course Title</label>
                <input className={inputClass} name="title" value={form.title} onChange={handleChange} placeholder="Course title" />
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
              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
                <textarea className={inputClass} name="description" value={form.description} onChange={handleChange} placeholder="Course description" rows={3} />
              </div>
            </div>

            {/* Assessments */}
            <div className="border-t border-brand-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-brand-text uppercase tracking-wide">Assessments</h3>
                <select
                  className="px-3 py-1.5 border border-brand-border rounded-lg text-xs text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
                  defaultValue=""
                  onChange={(e) => {
                    const type = e.target.value;
                    if (!type || editId) return;
                    const index = form.assessments.length;
                    addAssessment(type);
                    setOpenAssessments((prev) => ({ ...prev, [index]: true }));
                    e.target.value = "";
                  }}
                >
                  <option value="">+ Add Assessment</option>
                  <option value="quiz">Quiz</option>
                  <option value="practical">Practical</option>
                </select>
              </div>

              <div className="space-y-3">
                {form.assessments.map((a, ai) => (
                  <div key={ai + "-" + a.type} className="border border-brand-border rounded-xl overflow-hidden">
                    {/* Assessment header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-canvas cursor-pointer"
                      onClick={() => setOpenAssessments((p) => ({ ...p, [ai]: !p[ai] }))}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${a.type === "quiz" ? "bg-emerald/10 text-emerald" : "bg-brand-muted/10 text-brand-muted"}`}>
                          {a.type}
                        </span>
                        <span className="text-sm font-medium text-brand-text">{a.title || "Untitled Assessment"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex items-center justify-center w-6 h-6 rounded text-brand-danger hover:bg-brand-danger/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); deleteAssessment(ai); }}
                        >
                          <FaTrash size={10} />
                        </button>
                        <i className={`fa fa-chevron-${openAssessments[ai] ? "up" : "down"} text-xs text-brand-muted`}></i>
                      </div>
                    </div>

                    {/* Assessment body */}
                    {openAssessments[ai] && (
                      <div className="px-4 py-4 space-y-3 border-t border-brand-border">
                        <div>
                          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Assessment Title</label>
                          <input className={inputClass} value={a.title} placeholder="Assessment Title" onChange={(e) => updateAssessment(ai, "title", e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
                          <textarea className={inputClass} placeholder="Assessment Description" value={a.description || ""} rows={3} onChange={(e) => updateAssessment(ai, "description", e.target.value)} />
                        </div>

                        {/* Quiz questions */}
                        {a.type === "quiz" && (
                          <div className="space-y-3">
                            <h5 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Questions</h5>
                            {a.questions.map((q, qi) => (
                              <div key={qi} className="bg-canvas border border-brand-border rounded-lg p-3 space-y-2">
                                <input
                                  className={inputClass}
                                  placeholder={`Question ${qi + 1}`}
                                  value={q.prompt}
                                  onChange={(e) => {
                                    const arr = [...form.assessments];
                                    arr[ai].questions[qi].prompt = e.target.value;
                                    setForm({ ...form, assessments: arr });
                                  }}
                                />
                                <div className="space-y-1.5">
                                  {q.options.map((o, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${ai}-${qi}`}
                                        className="accent-emerald flex-shrink-0"
                                        checked={Array.isArray(q.correctOptionKeys) && q.correctOptionKeys.includes(o.key)}
                                        onChange={() => {
                                          const arr = [...form.assessments];
                                          arr[ai].questions[qi].correctOptionKeys = [o.key];
                                          setForm({ ...form, assessments: arr });
                                        }}
                                      />
                                      <input
                                        className="flex-1 px-3 py-1.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
                                        placeholder={`Option ${oi + 1}`}
                                        value={o.text}
                                        onChange={(e) => {
                                          const arr = [...form.assessments];
                                          arr[ai].questions[qi].options[oi].text = e.target.value;
                                          setForm({ ...form, assessments: arr });
                                        }}
                                      />
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-emerald-hover mt-1 transition-colors"
                                    onClick={() => addOption(ai, qi)}
                                  >
                                    <FaPlus size={9} /> Add Option
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-emerald hover:text-emerald transition-colors"
                              onClick={() => addQuestion(ai)}
                            >
                              <FaPlus size={9} /> Add Question
                            </button>
                          </div>
                        )}

                        {/* Practical instructions */}
                        {a.type === "practical" && (
                          <div>
                            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Practical Instructions</label>
                            <textarea
                              className={inputClass}
                              rows={3}
                              placeholder="Practical Instructions"
                              value={a.practicalInstructions}
                              onChange={(e) => updateAssessment(ai, "practicalInstructions", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <button
                type="submit"
                className="px-6 py-2 text-sm font-semibold text-white bg-emerald hover:bg-emerald-hover rounded-lg transition-colors"
              >
                {editId ? "Update Course" : "Save Course"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* LIST VIEW */
  return (
    <div className="space-y-5">
      <PageHeader title="Courses" subtitle="Manage your courses">
        <button
          className="flex items-center gap-2 bg-emerald hover:bg-emerald-hover text-white text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          onClick={() => {
            if (dtRef.current) { dtRef.current.destroy(); dtRef.current = null; }
            setEditId(null);
            setForm({ title: "", description: "", categoryIds: [], status: "draft", assessments: [] });
            setView("form");
          }}
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add Course
        </button>
      </PageHeader>

      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
        {["published", "draft"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${activeTab === tab ? "bg-charcoal text-white" : "text-brand-muted hover:text-brand-text"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <TableContainer>
        <table ref={tableRef} width="100%">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </TableContainer>
    </div>
  );
}
