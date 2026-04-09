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
  const [showPopup, setShowPopup] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- LOAD STAFF ----------------
  const loadStaff = async () => {
    try {
      const res = await api.get("/staff");

      const acceptedStaff =
        (res.data.staff || []).filter(
          (s) => s.inviteStatus === "accepted"
        );

      setStaff(acceptedStaff);
    } catch (err) {
      console.error("Staff load error:", err);

      // ✅ Only show real error (avoid false toast)
      if (err.response) {
        toastr.error("Failed to load staff");
      }
    }
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    loadStaff();
  }, []);

  // ---------------- DATATABLE INIT ----------------
  useEffect(() => {
    if (staff.length === 0) return;

    const timer = setTimeout(() => {
      if ($.fn.DataTable.isDataTable("#staffTable")) {
        $("#staffTable").DataTable().destroy();
      }

      $("#staffTable").DataTable({
        pageLength: 10,
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if ($.fn.DataTable.isDataTable("#staffTable")) {
        $("#staffTable").DataTable().destroy();
      }
    };
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

  // ---------------- OPEN POPUP ----------------
  const openAssignPopup = () => {
    if (selected.length === 0)
      return toastr.error("Select at least one staff");

    setShowPopup(true);
  };

  // ---------------- CONFIRM ASSIGN ----------------
  const confirmAssign = async () => {
    if (!dueDate)
      return toastr.error("Please select due date");

    try {
      setLoading(true);

      await api.post(`/courses/${courseId}/assign`, {
        staffIds: selected,
        dueDate: new Date(dueDate).toISOString(),
      });

      toastr.success("Course assigned successfully");

      setShowPopup(false);
      setSelected([]);
      setDueDate("");

      // ✅ Delay reload to avoid race condition
      setTimeout(() => {
        loadStaff();
      }, 300);

    } catch (err) {
      if (err.response?.status === 409) {
        toastr.warning(
          "Some selected staff were already assigned. Due date updated."
        );
      } else {
        toastr.error(
          err.response?.data?.error || "Assign failed"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">ASSIGN COURSE TO STAFF</h1>
        <p className="wlc-ms">
          Please assign staff to course.
        </p>
      </div>

      {/* TOP BUTTON */}
      <div className="tp-sc">
        <span
          className="logout-btn"
          onClick={openAssignPopup}
          style={{
            opacity: selected.length === 0 ? 0.6 : 1,
            pointerEvents: selected.length === 0 ? "none" : "auto",
          }}
        >
          <i className="fa-solid fa-plus"></i>
          <span className="tooltiptext">Assign Course</span>
        </span>

        <Link className="logout-btn" to="/dashboard/courses">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
      </div>

      {/* TABLE */}
      {staff.length === 0 ? (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h3>No accepted staff available.</h3>
        </div>
      ) : (
        <table
          key={staff.length}
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
                  checked={
                    selected.length === staff.length &&
                    staff.length > 0
                  }
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Locations</th>
            </tr>
          </thead>

          <tbody>
            {staff.map((s) => (
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
      )}

      {/* POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Assign Course</h3>

            <p>
              You selected <b>{selected.length}</b> staff.
            </p>

            <div style={{ margin: "15px 0" }}>
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                }}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                className="snd-btn"
                onClick={confirmAssign}
                disabled={loading}
              >
                {loading ? "Assigning..." : "Assign"}
              </button>

              <button
                className="snd-btn"
                style={{ marginLeft: "10px" }}
                onClick={() => setShowPopup(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .popup-box {
    background: #fff;
    padding: 25px;
    border-radius: 8px;
    width: 400px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
  }
`}</style>
    </div>
  );
}