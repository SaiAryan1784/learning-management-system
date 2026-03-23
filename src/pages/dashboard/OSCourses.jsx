import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import "datatables.net";

export default function OSCourse() {
  const tableRef = useRef();
  const dtRef = useRef();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("draft");

  // ---------------- LOAD DATA ----------------
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
      const res = await api.get("/courses");
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Error loading courses");
    }
  };

  useEffect(() => {
    loadCategories();
    loadCourses();
  }, []);

  // ---------------- DATATABLE ----------------
  useEffect(() => {
    const filtered = courses.filter((c) => c.status === activeTab);

    if (dtRef.current) {
      dtRef.current.clear().rows.add(filtered).draw();
      return;
    }

    dtRef.current = $(tableRef.current).DataTable({
      data: filtered,
      destroy: true,
      columns: [
        {
          data: null,
          render: (data, type, row, meta) => meta.row + 1,
        },
        { data: "title" },
        {
          data: null,
          render: (data) => data.categories?.map((cat) => cat.name).join(", ") || "",
        },
        { data: "status" },
        {
          data: null,
          orderable: false,
          render: (data) => `
            <div class="act-btns">

              ${
                data.status === "draft"
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

    // CLEAN OLD EVENTS
    $(tableRef.current).off("click", ".edit-btn");
    $(tableRef.current).off("click", ".module-btn");
    $(tableRef.current).off("click", ".assign-btn");
    $(tableRef.current).off("click", ".publish-btn");

    // EDIT
    $(tableRef.current).on("click", ".edit-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      navigate(`/dashboard/course-add/${rowData._id}`);
    });

    // MODULE
    $(tableRef.current).on("click", ".module-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      navigate(`/dashboard/courses/${rowData._id}/modules`);
    });

    // ASSIGN
    $(tableRef.current).on("click", ".assign-btn", function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      navigate(`/dashboard/courses/${rowData._id}/assign`);
    });

    // PUBLISH (PATCH)
    $(tableRef.current).on("click", ".publish-btn", async function () {
      const rowData = dtRef.current.row($(this).closest("tr")).data();
      try {
        await api.patch(`/courses/${rowData._id}/publish`);
        toastr.success("Course published successfully");
        loadCourses();
      } catch {
        toastr.error("Error publishing course");
      }
    });

  }, [courses, activeTab]);

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">COURSES</h1>
        <p className="wlc-ms">Manage your courses</p>
      </div>

      <div className="tp-sc">
        <span className="logout-btn" onClick={() => navigate("/dashboard/course-add")}>
          <i className="fa-solid fa-plus"></i>
          <span className="tooltiptext">Add Course</span>
        </span>

        <span className="logout-btn" onClick={() => navigate("/dashboard")}>
          <i className="fa-solid fa-arrow-left"></i>
        </span>
      </div>

      <div className="pg-tabs">
        <span className={`pg-tb ${activeTab === "draft" ? "active-tab" : ""}`} onClick={() => setActiveTab("draft")}>Draft</span>
        <span className={`pg-tb ${activeTab === "published" ? "active-tab" : ""}`} onClick={() => setActiveTab("published")}>Published</span>
      </div>

      <table ref={tableRef} border="1" cellPadding="10" cellSpacing="0" width="100%">
        <thead>
          <tr>
            <th>Sr No</th>
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