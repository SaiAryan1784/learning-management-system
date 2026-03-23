import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function StaffComplianceReport() {
  const tableRef = useRef();
  const dtRef = useRef();

  const [summary, setSummary] = useState({
    totalStaffTracked: 0,
    totalMandatoryAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0,
    completionRate: 0,
  });

  // ---------------- LOAD SUMMARY ----------------
  const loadSummary = async () => {
    try {
      const res = await api.get("/reports/compliance/overview");
      setSummary(res.data.summary);
    } catch {
      toastr.error("Failed to load compliance summary");
    }
  };

  // ---------------- LOAD DATATABLE ----------------
  useEffect(() => {
    loadSummary();

    if ($.fn.DataTable.isDataTable(tableRef.current)) {
      $(tableRef.current).DataTable().destroy();
    }

    dtRef.current = $(tableRef.current).DataTable({
      processing: true,
      serverSide: true,
      ajax: async (data, callback) => {
        try {
          const res = await api.get(
            `/reports/compliance/staff?format=json&page=${
              Math.floor(data.start / data.length) + 1
            }&limit=${data.length}`
          );
          callback({
            data: res.data.rows,
            recordsTotal: res.data.pagination.total,
            recordsFiltered: res.data.pagination.total,
          });
        } catch (err) {
          toastr.error("Failed to load staff compliance data");
          callback({
            data: [],
            recordsTotal: 0,
            recordsFiltered: 0,
          });
        }
      },
      columns: [
        { data: "staffName" },
        { data: "staffEmail" },
        { data: "mandatoryCourses" },
        { data: "completedCourses" },
        { data: "overdueCourses" },
        { data: "complianceScore" },
      ],
    });

    // VIEW DETAILS BUTTON
   
  }, []);

  return (
    <div className="mx-wd">
      <div className="dash-tp">
        <h1 className="wlc-tl">Staff Compliance Report</h1>
        <p className="wlc-ms">
          Overview of staff compliance status and mandatory course completion
        </p>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="stats">
        <div className="stats-grid" style={{ marginBottom: "20px" }}>
        <div className="stats-card">
          <div className="stats-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stats-content">
            <p>Total Staff Tracked</p>
            <div className="stats-number">{summary.totalStaffTracked}</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <i className="bi bi-journal-bookmark-fill"></i>
          </div>
          <div className="stats-content">
            <p>Total Mandatory Assignments</p>
            <div className="stats-number">{summary.totalMandatoryAssignments}</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stats-content">
            <p>Completed Assignments</p>
            <div className="stats-number">{summary.completedAssignments}</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div className="stats-content">
            <p>Overdue Assignments</p>
            <div className="stats-number">{summary.overdueAssignments}</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className="stats-content">
            <p>Compliance Rate</p>
            <div className="stats-number">{summary.completionRate}%</div>
          </div>
        </div>
      </div>
      </div>

      {/* ================= DATATABLE ================= */}
      <table
        ref={tableRef}
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Email</th>
            <th>Mandatory Courses</th>
            <th>Completed Courses</th>
            <th>Overdue Courses</th>
            <th>Compliance Score</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  );
}