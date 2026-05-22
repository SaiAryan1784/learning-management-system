import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { Link } from "react-router-dom";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";
import { SectionLoader } from "../../components/ui/Spinner";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/courses/assigned");
      setCourses(res.data.courses || []);
    } catch {
      toastr.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (courses.length === 0) return;
    const table = $("#myCoursesTable").DataTable();
    return () => {
      table.destroy();
    };
  }, [courses]);

  return (
    <div className="space-y-5">
      <PageHeader title="My Courses" subtitle="Courses assigned to you" />

      {loading ? (
        <SectionLoader />
      ) : courses.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-book text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No courses assigned yet.</p>
        </div>
      ) : (
        <TableContainer>
          <table id="myCoursesTable" width="100%">
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald/10 text-emerald border border-emerald/20 rounded-md text-xs font-semibold hover:bg-emerald hover:text-white transition-colors"
                      to={`/dashboard/courses/${c._id}/modules`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
