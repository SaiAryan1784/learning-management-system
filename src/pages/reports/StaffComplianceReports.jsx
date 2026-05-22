import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { TableContainer } from "../../components/ui/TableContainer";

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
          const res = await api.get(
            `/reports/compliance/staff?format=json&page=${Math.floor(data.start / data.length) + 1}&limit=${data.length}`
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

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard icon="fa-users" label="Staff Tracked" value={summary.totalStaffTracked} />
        <StatCard icon="fa-book-bookmark" label="Mandatory Assignments" value={summary.totalMandatoryAssignments} />
        <StatCard icon="fa-circle-check" label="Completed" value={summary.completedAssignments} />
        <StatCard icon="fa-triangle-exclamation" label="Overdue" value={summary.overdueAssignments} danger={summary.overdueAssignments > 0} />
        <StatCard icon="fa-chart-line" label="Compliance Rate" value={`${summary.completionRate}%`} />
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
