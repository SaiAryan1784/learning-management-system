import { useEffect, useState } from "react";
import api from "../../api/api";
import { PageHeader } from "../../components/ui/PageHeader";
import RingStatCard from "../../components/dashboard/RingStatCard";

const RING_COLORS = ["#9B2C4E", "#D69A1F", "#1AA179", "#13525B"];
const DANGER_COLOR = "#B91C1C";

export default function ComplianceOverview() {
  const [summary, setSummary] = useState({
    totalStaffTracked: 0,
    totalMandatoryAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/compliance/overview");
      setSummary(res.data.summary || summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOverview(); }, []);

  if (loading) return <p className="text-brand-muted text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-5">
      <PageHeader title="Compliance Overview" subtitle="Summary of all compliance assignments">
        <div className="flex items-center gap-2 bg-emerald/10 border border-emerald/20 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-emerald">{summary.completionRate}%</span>
          <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide">Avg Completion</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <RingStatCard label="Staff Tracked" value={summary.totalStaffTracked} color={RING_COLORS[0]} />
        <RingStatCard label="Mandatory Assignments" value={summary.totalMandatoryAssignments} color={RING_COLORS[1]} />
        <RingStatCard label="Completed" value={summary.completedAssignments} color={RING_COLORS[2]} />
        <RingStatCard
          label="Overdue"
          value={summary.overdueAssignments}
          color={summary.overdueAssignments > 0 ? DANGER_COLOR : RING_COLORS[3]}
        />
      </div>
    </div>
  );
}
