import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function CourseAssign() {
  const { courseId } = useParams();

  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState([]);

  // ---------------- LOAD STAFF ----------------
  const loadStaff = async () => {
    try {
      if ($.fn.DataTable.isDataTable("#staffTable")) {
        $("#staffTable").DataTable().destroy();
      }

      const res = await api.get("/staff");

      // ✅ only accepted staff
      const acceptedStaff =
        (res.data.staff || []).filter(
          (s) => s.inviteStatus === "accepted"
        );

      setStaff(acceptedStaff);
    } catch {
      toastr.error("Failed to load staff");
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (staff.length > 0) {
      setTimeout(() => {
        $("#staffTable").DataTable();
      }, 100);
    }
  }, [staff]);

  // ---------------- SELECT ----------------
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSelected(checked ? staff.map((s) => s._id) : []);
  };

  // ---------------- ASSIGN ----------------
  const handleAssign = async () => {
    if (selected.length === 0)
      return toastr.error("Select at least one staff");

    try {
      await api.post(`/courses/${courseId}/assign`, {
        staffIds: selected,
      });

      toastr.success("Staff assigned to course");
    } catch (err) {
      toastr.error(err.response?.data?.error || "Assign failed");
    }
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">ASSIGN STAFF TO COURSE</h1>
        <p className="wlc-ms">
          Please assign staff to course and take a look at your business.
        </p>
      </div>

      {/* TOP BUTTON */}
      <div className="frm-cntr">
        <Link className="logout-btn" to="/dashboard/courses">
          <i className="fa-solid fa-arrow-left"></i> Courses
        </Link>
        <h2 className="sc-tl">Assign Staff To Course</h2>
        <div style={{ margin: "20px auto",display:"block",width:"max-content" }}>
            <span
              className="snd-btn"
              onClick={handleAssign}
            >
              Assign Course To Selected Staff
            </span>
          </div>
      </div>

      {/* TABLE */}
      {staff.length === 0 ? (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h3>No accepted staff available.</h3>
        </div>
      ) : (
        <>
          <table
            id="staffTable"
            border="1"
            cellPadding="10"
            cellSpacing="0"
            width="100%"
          >
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      handleSelectAll(e.target.checked)
                    }
                    checked={selected.length === staff.length}
                  />
                </th>
                <th>Sr No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Locations</th>
              </tr>
            </thead>

            <tbody>
              {staff.map((s, i) => (
                <tr
                  key={s._id}
                  style={{
                    background: selected.includes(s._id)
                      ? "#f0f6ff"
                      : "transparent",
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(s._id)}
                      onChange={() => handleSelect(s._id)}
                    />
                  </td>
                  <td>{i + 1}</td>
                  <td>{s.user?.name || "—"}</td>
                  <td>{s.email}</td>
                  <td>{s.role?.name || "—"}</td>
                  <td>
                    {s.locations?.length > 0
                      ? s.locations.map((l) => l.name).join(", ")
                      : "Org Wide"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
