import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { FaPlus, FaTrash } from "react-icons/fa";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { Button } from "../../components/ui/Button";
import { SectionLoader } from "../../components/ui/Spinner";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent mb-3";

const COURSE_COLORS = ["#10B981","#3B82F6","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899","#F97316"];
function getCourseColor(title = "") {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  return COURSE_COLORS[Math.abs(h) % COURSE_COLORS.length];
}

const labelBtn = (cls, icon, label, style) =>
  `<button class="${cls} course-action-btn" title="${label}" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;${style}">
    <i class="fa-solid ${icon}" style="font-size:10px;"></i>${label}
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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableView, setTableView] = useState(() => localStorage.getItem("coursesViewPref") || "table");

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
      setLoading(true);
      const res = await api.get("/courses", { params: { t: Date.now() } });
      if (dtRef.current) {
        dtRef.current.destroy();
        dtRef.current = null;
      }
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Error loading courses");
    } finally {
      setLoading(false);
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
    if (view !== "list" || tableView !== "table") return;

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
            `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
              ${labelBtn("module-btn", "fa-layer-group", "Modules", "border:1px solid #10B981;color:#10B981;background:rgba(16,185,129,0.06);")}
              ${labelBtn("edit-btn", "fa-pen", "Edit", "border:1px solid #E5E7EB;color:#6B7280;background:transparent;")}
              ${d.status === "draft" ? labelBtn("publish-btn", "fa-check", "Publish", "border:1px solid #E5E7EB;color:#6B7280;background:transparent;") : ""}
              ${labelBtn("assign-btn", "fa-user-plus", "Assign", "border:1px solid #E5E7EB;color:#6B7280;background:transparent;")}
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
  }, [courses, activeTab, view, tableView]);

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
      setSaving(true);
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
      setView("list");
      setEditId(null);
      setForm({ title: "", description: "", categoryIds: [], status: "draft", assessments: [] });
      loadCourses();
    } catch {
      toastr.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* FORM VIEW */
  if (view === "form") {
    return (
      <div className="space-y-5">
        <PageHeader title={editId ? "Edit Course" : "Add Course"} subtitle="Create or update a course">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-white !border-white/20 hover:!bg-white/10"
            leadingIcon={<i className="fa fa-arrow-left text-xs" />}
            onClick={() => setView("list")}
          >
            Back
          </Button>
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

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="ghost" onClick={() => setView("list")}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editId ? "Update Course" : "Save Course"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  const openAddForm = () => {
    if (dtRef.current) { dtRef.current.destroy(); dtRef.current = null; }
    setEditId(null);
    setForm({ title: "", description: "", categoryIds: [], status: "draft", assessments: [] });
    setView("form");
  };

  const filteredCount = courses.filter((c) => c.status === activeTab).length;

  const switchView = (v) => {
    setTableView(v);
    localStorage.setItem("coursesViewPref", v);
    if (v === "grid" && dtRef.current) {
      dtRef.current.destroy();
      dtRef.current = null;
    }
  };

  /* LIST VIEW */
  return (
    <div className="space-y-5">
      <PageHeader title="Courses" subtitle="Manage your courses">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<i className="fa-solid fa-plus text-xs" />}
          onClick={openAddForm}
        >
          Add Course
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
          {["published", "draft"].map((tab) => (
          <button
            key={tab}
            className={`relative px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
              activeTab === tab ? "text-white" : "text-brand-muted hover:text-brand-text"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {activeTab === tab && (
              <motion.span
                layoutId="course-tab-pill"
                className="absolute inset-0 bg-charcoal rounded-md"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 ml-auto">
          {[
            { id: "table", icon: "fa-list" },
            { id: "grid",  icon: "fa-grip" },
          ].map(({ id, icon }) => (
            <button
              key={id}
              onClick={() => switchView(id)}
              className={`flex items-center justify-center w-8 h-7 rounded-md transition-colors ${
                tableView === id ? "bg-charcoal text-white" : "text-brand-muted hover:text-brand-text"
              }`}
              title={id === "table" ? "Table view" : "Grid view"}
            >
              <i className={`fa-solid ${icon} text-xs`} />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SectionLoader />
      ) : (
        <>
          {filteredCount === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 bg-surface border border-brand-border rounded-xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-book-open text-emerald text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text mb-1">
                No {activeTab} courses yet
              </h3>
              <p className="text-sm text-brand-muted mb-6 max-w-xs">
                {activeTab === "published"
                  ? "Publish a draft course to see it here."
                  : "Create your first course to get started."}
              </p>
              {activeTab === "draft" && (
                <Button
                  variant="primary"
                  size="md"
                  leadingIcon={<i className="fa-solid fa-plus" />}
                  onClick={openAddForm}
                >
                  Create your first course
                </Button>
              )}
            </motion.div>
          )}

          {/* Table view */}
          <div className={tableView !== "table" || filteredCount === 0 ? "hidden" : ""}>
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

          {/* Grid view */}
          {tableView === "grid" && filteredCount > 0 && (() => {
            const filtered = courses.filter((c) => c.status === activeTab);
            return (
              <motion.div
                initial="hidden" animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filtered.map((course) => {
                  const color = getCourseColor(course.title);
                  const cats = (course.categories || []).map((c) => c.name).join(", ");
                  return (
                    <motion.div
                      key={course._id}
                      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-surface border border-brand-border rounded-xl overflow-hidden hover:shadow-elevated transition-shadow duration-200"
                    >
                      {/* Thumbnail strip */}
                      <div className="h-2 w-full" style={{ backgroundColor: color }} />
                      <div className="p-4">
                        {/* Avatar + title */}
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {course.title?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2">{course.title}</p>
                            {cats && <p className="text-xs text-brand-muted mt-0.5 truncate">{cats}</p>}
                          </div>
                          <span
                            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: course.status === "published" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                              color: course.status === "published" ? "#10B981" : "#6B7280",
                            }}
                          >
                            {course.status}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-brand-border">
                          <Button variant="outline" size="sm" leadingIcon={<i className="fa-solid fa-layer-group text-[10px]" />}
                            onClick={() => { window.location.href = `/dashboard/courses/${course._id}/modules`; }}>
                            Modules
                          </Button>
                          <Button variant="ghost" size="sm" leadingIcon={<i className="fa-solid fa-pen text-[10px]" />}
                            onClick={() => {
                              if (dtRef.current) { dtRef.current.destroy(); dtRef.current = null; }
                              setOpenAssessments({});
                              setOpenQuestions({});
                              const normalizedAssessments = (course.assessments || [])
                                .filter((a) => a.active !== false)
                                .map((a) => ({
                                  type: a.type, title: a.title, description: a.description || "",
                                  passPercent: a.passPercent || 70, maxAttempts: a.maxAttempts || 3,
                                  certificateValidityDays: 365, renewalWindowDays: 30,
                                  questions: (a.questions || []).map((q) => ({ prompt: q.prompt, correctOptionKeys: q.correctOptionKeys || [], options: (q.options || []).map((o) => ({ key: o.key, text: o.text })) })),
                                  practicalInstructions: a.practicalInstructions || "",
                                }));
                              setEditId(course._id);
                              setForm({ title: course.title, description: course.description, categoryIds: course.categories?.map((c) => c._id) || [], status: course.status, assessments: normalizedAssessments });
                              setView("form");
                            }}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" leadingIcon={<i className="fa-solid fa-user-plus text-[10px]" />}
                            onClick={() => { window.location.href = `/dashboard/courses/${course._id}/assign`; }}>
                            Assign
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })()}
        </>
      )}
    </div>
  );
}
