import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { Link } from "react-router-dom";
import $ from "jquery";
import "datatables.net";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);

  const loadCourses = async () => {
    try {
      const res = await api.get("/courses/assigned"); // ✅ Correct API
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Failed to load courses");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // ✅ Proper DataTable lifecycle
  useEffect(() => {
    if (courses.length === 0) return;

    const table = $("#myCoursesTable").DataTable();

    return () => {
      table.destroy();
    };
  }, [courses]);

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">My Courses</h1>
        <p className="wlc-ms">Courses assigned to you</p>
      </div>

      {courses.length === 0 ? (
        <h3 style={{ textAlign: "center" }}>
          No courses assigned yet.
        </h3>
      ) : (
        <table id="myCoursesTable" className="tbl" width="100%">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Title</th>
              <th>Description</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c._id}>
                <td>{i + 1}</td>
                <td>{c.title}</td>
                <td>{c.description}</td>
                <td>
                  <Link
                    className="logout-btn"
                    to={`/dashboard/courses/${c._id}/modules`} // ✅ Correct route
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
