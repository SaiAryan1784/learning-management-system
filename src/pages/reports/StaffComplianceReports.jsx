import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import RingStatCard from "../../components/dashboard/RingStatCard";
import { TableContainer } from "../../components/ui/TableContainer";

const RING_COLORS = ["#9B2C4E", "#D69A1F", "#1AA179", "#13525B", "#C2531B"];
const DANGER_COLOR = "#B91C1C";

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

  const loadSummary = async () => {
    try {
      const res = await api.get("/reports/compliance/overview");
      setSummary(res.data.summary);
    } catch {
      toastr.error("Failed to load compliance summary");
    }
  };

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
          const page = Math.floor(data.start / data.length) + 1;
          const q = encodeURIComponent(data.search?.value || "");
          const res = await api.get(
            `/reports/compliance/staff?format=json&page=${page}&limit=${data.length}&search=${q}`
          );
          callback({
            data: res.data.rows,
            recordsTotal: res.data.pagination.total,
            recordsFiltered: res.data.pagination.total,
          });
        } catch {
          toastr.error("Failed to load staff compliance data");
          callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
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
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Staff Compliance Report" subtitle="Overview of staff compliance status and mandatory course completion" />

      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4">
        <RingStatCard label="Staff Tracked" value={summary.totalStaffTracked} color={RING_COLORS[0]} />
        <RingStatCard label="Mandatory Assignments" value={summary.totalMandatoryAssignments} color={RING_COLORS[1]} />
        <RingStatCard label="Completed" value={summary.completedAssignments} color={RING_COLORS[2]} />
        <RingStatCard
          label="Overdue"
          value={summary.overdueAssignments}
          color={summary.overdueAssignments > 0 ? DANGER_COLOR : RING_COLORS[3]}
        />
        <RingStatCard label="Compliance Rate" value={`${summary.completionRate}%`} color={RING_COLORS[4]} />
      </div>

      <TableContainer>
        <table ref={tableRef} width="100%">
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
      </TableContainer>
    </div>
  );
}
