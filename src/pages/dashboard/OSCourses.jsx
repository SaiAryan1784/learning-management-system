import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import $ from "jquery";
import "datatables.net";

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
    const res = await api.get("/courses", {
      params: { t: Date.now() } // 🔥 FORCE REFRESH
    });
    setCourses(res.data.courses || []);
  } catch {
    toastr.error("Error loading courses");
  }
};

  useEffect(() => {
    loadCategories();
    loadCourses();
  }, []);

  // CLEANUP DATATABLE ON UNMOUNT
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
        { data: "status" },
        {
          data: null,
          orderable: false,
          render: (d) => `
            <div class="act-btns">

              <span class="logout-btn edit-btn" style="margin-left:8px;">
                <i class="fa fa-edit"></i>
                <span class="tooltiptext">Edit</span>
              </span>

              ${
                d.status === "draft"
                  ? `<span class="logout-btn publish-btn" style="margin-left:8px;">
                      <i class="fa fa-check"></i>
                      <span class="tooltiptext">Publish</span>
                    </span>`
                  : ""
              }

              <span class="logout-btn module-btn" style="margin-left:8px;">
                <i class="fa fa-book"></i>
                <span class="tooltiptext">Add course module</span>
              </span>

              <span class="logout-btn assign-btn" style="margin-left:8px;">
                <i class="fa fa-user-plus"></i>
                <span class="tooltiptext">Assign</span>
              </span>

            </div>
          `,
        },
      ],
    });

    // OFF old events
    $(tableRef.current).off("click", ".edit-btn");
    $(tableRef.current).off("click", ".publish-btn");
    $(tableRef.current).off("click", ".module-btn");
    $(tableRef.current).off("click", ".assign-btn");

    // EDIT
    $(tableRef.current).on("click", ".edit-btn", function () {
  const rowData = dtRef.current.row($(this).closest("tr")).data();

  if (dtRef.current) {
    dtRef.current.destroy();
    dtRef.current = null;
  }

  // ✅ NORMALIZE assessments
  const normalizedAssessments = (rowData.assessments || []).map(a => ({
    ...a,
    questions: (a.questions || []).map(q => ({
      ...q,
      correctOptionKeys: q.correctOptionKeys || [], // 🔥 FIX
      options: (q.options || []).map(o => ({
        key: o.key,
        text: o.text
      }))
    }))
  }));

  setEditId(rowData._id);
  setForm({
    title: rowData.title,
    description: rowData.description,
    categoryIds: rowData.categories?.map((c) => c._id) || [],
    status: rowData.status,
    assessments: normalizedAssessments, // ✅ USE NORMALIZED
  });

  setView("form");
});

    // PUBLISH
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

    // MODULE
    $(tableRef.current).on("click", ".module-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      window.location.href = `/dashboard/courses/${rowData._id}/modules`;
    });

    // ASSIGN
    $(tableRef.current).on("click", ".assign-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      window.location.href = `/dashboard/courses/${rowData._id}/assign`;
    });
  }, [courses, activeTab, view]);

  /* FORM */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

 const addAssessment = (type) => {
  const newAssessment =
  type === "quiz"
    ? {
        type: "quiz",
        title: "",
        description: "",
        passPercent: 70,
        maxAttempts: 3,
        certificateValidityDays: 365,
        renewalWindowDays: 30,
        questions: [],
      }
    : {
        type: "practical",
        title: "",
        description: "",
        passPercent: 70,
        maxAttempts: 3,
        certificateValidityDays: 365,
        renewalWindowDays: 30,
        practicalInstructions: "",
      };

  setForm((prev) => ({
    ...prev,
    assessments: [...prev.assessments, newAssessment],
  }));
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
    arr[ai].questions.push({ prompt: "", options: [],correctOptionKeys: [], });
    setForm({ ...form, assessments: arr });
  };

  const addOption = (ai, qi) => {
  const arr = [...form.assessments];

  const optionIndex = arr[ai].questions[qi].options.length;

  const key = String.fromCharCode(65 + optionIndex); // A, B, C, D

  arr[ai].questions[qi].options.push({
    key, // ✅ IMPORTANT
    text: "",
  });

  setForm({ ...form, assessments: arr });
};
const preparePayload = () => {
  return {
    title: form.title,
    description: form.description,
    categoryIds: form.categoryIds,

    // ✅ REQUIRED
    isComplianceCourse: false,
    complianceType: null,

    assessments: form.assessments.map((a) => {
      const base = {
        type: a.type,
        title: a.title,
        description: a.description || "",
        passPercent: a.passPercent || 70,
        maxAttempts: a.maxAttempts || 3,

        // ✅ REQUIRED FIELDS
        certificateValidityDays: 365,
        renewalWindowDays: 30,
      };

      if (a.type === "quiz") {
        return {
          ...base,
          questions: (a.questions || []).map((q) => ({
            prompt: q.prompt,
            options: q.options,
            correctOptionKeys: q.correctOptionKeys || [],
          })),
        };
      }

      if (a.type === "practical") {
        return {
          ...base,
          practicalInstructions: a.practicalInstructions || "",
        };
      }

      return base;
    }),
  };
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let res;
      const payload = preparePayload();
      if (editId) {
        res = await api.put(`/courses/${editId}`, payload);
        toastr.success("Course updated");
      } else {
        res = await api.post("/courses", payload);
        toastr.success("Course created");
      }

      if (!editId && form.status === "published") {
        const id = res.data._id;
        await api.patch(`/courses/${id}/publish`);
      }
      console.log("PAYLOAD 👉", payload);

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
      <div className="mx-wd">
        <div className="dash-tp">
          <h1 className="wlc-tl">{editId ? "Edit Course" : "Add Course"}</h1>
          <p className="wlc-ms">Create or update a course</p>
        </div>

        <button
          className="logout-btn mt-2"
          onClick={() => {
            setView("list");
          }}
        >
          <i className="fa fa-arrow-left"></i>
        </button>

        <form onSubmit={handleSubmit} className="add-form mt-2">
  <div className="row">
    <div className="col-md-6">
      <input
        className="login-ip"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Course title"
      />
    </div>

    <div className="col-md-6">
      <select
        className="login-ip"
        value={form.categoryIds[0] || ""}
        onChange={(e) => setForm({ ...form, categoryIds: [e.target.value] })}
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>

    <div className="col-md-6">
      <select
        className="login-ip"
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </div>

    <div className="col-md-6">
      <textarea
        placeholder="Course description"
        className="login-ip"
        name="description"
        value={form.description}
        onChange={handleChange}
      />
    </div>
  </div>

  {/* ===== Assessment Header ===== */}
  <h3 className="not-tl mb-2">ADD Assessment</h3>

  <div className="assessment-actions">
  <select
    className="login-ip"
    defaultValue=""
    onChange={(e) => {
      const type = e.target.value;
      if (!type) return;

      const index = form.assessments.length;

      addAssessment(type);

      // auto open newly added assessment
      setOpenAssessments((prev) => ({
        ...prev,
        [index]: true,
      }));

      e.target.value = "";
    }}
  >
    <option value="">Select Assessment</option>
    <option value="quiz">Quiz</option>
    <option value="practical">Practical</option>
  </select>
</div>

  {/* ===== Assessments ===== */}
  {form.assessments.map((a, ai) => (
    <div key={ai} className="assessment-card">
      
      {/* Header */}
      <div className="assessment-header">
        <h4 className="not-tl">{a.type.toUpperCase()}: {a.title}</h4>
        <button
          type="button"
          className="logout-btn"
          onClick={() => deleteAssessment(ai)}
        >
          <FaTrash />
        </button>
      </div>

      {/* Body */}
      <div className="assessment-body">
        <input
          className="login-ip"
          value={a.title}
          placeholder="Assessment Title"
          onChange={(e) => updateAssessment(ai, "title", e.target.value)}
        />
        <textarea
          className="login-ip"
          placeholder="Assessment Description"
          value={a.description || ""}
          rows="5"
          onChange={(e) => updateAssessment(ai, "description", e.target.value)}
        ></textarea>

        {/* ===== QUIZ ===== */}
        {a.type === "quiz" && (
          <div className="quiz-section">
            <h5 className="not-tl mb-2">Add Questions</h5>

            {a.questions.map((q, qi) => (
              <div key={qi} className="quiz-question col-md-9">

                <input
                  className="login-ip"
                  placeholder={`Question ${qi + 1}`}
                  value={q.prompt}
                  onChange={(e) => {
                    const arr = [...form.assessments];
                    arr[ai].questions[qi].prompt = e.target.value;
                    setForm({ ...form, assessments: arr });
                  }}
                />

                <div className="quiz-options">
                  {q.options.map((o, oi) => (
                   <div key={oi} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    
                      {/* ✅ SELECT CORRECT ANSWER */}
                      <input
                        type="radio"
                        name={`correct-${ai}-${qi}`} // one correct answer
                        checked={Array.isArray(q.correctOptionKeys) && q.correctOptionKeys.includes(o.key)}
                        onChange={() => {
                          const arr = [...form.assessments];

                          arr[ai].questions[qi].correctOptionKeys = [o.key];

                          setForm({ ...form, assessments: arr });
                        }}
                      />

                      {/* OPTION TEXT */}
                      <input
                        className="login-ip"
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
                    className="logout-btn opt-btn"
                    onClick={() => addOption(ai, qi)}
                  >
                    <span className="tooltiptext">Add Option</span>
                    <FaPlus /> 
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="logout-btn"
              onClick={() => addQuestion(ai)}
            >
                <span className="tooltiptext">Add Question</span>

              <FaPlus /> 
            </button>
          </div>
        )}

        {/* ===== PRACTICAL ===== */}
        {a.type === "practical" && (
          <div className="practical-section">
            <textarea
              className="login-ip"
              rows={3}
              placeholder="Practical Instructions"
              value={a.practicalInstructions}
              onChange={(e) =>
                updateAssessment(ai, "practicalInstructions", e.target.value)
              }
            />
          </div>
        )}
      </div>
    </div>
  ))}

  {/* Submit */}
  <button className="snd-btn mt-3" type="submit">
    Save
  </button>
</form>
      </div>
    );
  }

  /* LIST VIEW */
  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">COURSES</h1>
        <p className="wlc-ms">Manage your courses</p>
      </div>

      <div className="tp-sc">
        <span
          className="logout-btn"
          onClick={() => {
            if (dtRef.current) {
              dtRef.current.destroy();
              dtRef.current = null;
            }
            setView("form");
          }}
        >
          <i className="fa-solid fa-plus"></i>
          <span className="tooltiptext">Add Course</span>
        </span>
      </div>

      <div className="pg-tabs">
        <span className={`pg-tb ${activeTab === "published" ? "active-tab" : ""}`} onClick={() => setActiveTab("published")}>Published</span>
        <span className={`pg-tb ${activeTab === "draft" ? "active-tab" : ""}`} onClick={() => setActiveTab("draft")}>Draft</span>
      </div>

      <table ref={tableRef} border="1" cellPadding="10" cellSpacing="0" width="100%">
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
    </div>
  );
}
