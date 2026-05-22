import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";

export default function RunAssignments() {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [onboardingOnly, setOnboardingOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [automationResult, setAutomationResult] = useState(null);
  const [activeTab, setActiveTab] = useState("assignment");

  const loadStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaff(res.data.staff || []);
    } catch {
      toastr.error("Failed to load staff");
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const toggleStaff = (id) =>
    setSelectedStaff((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const runAssignments = async () => {
    if (selectedStaff.length === 0) { toastr.warning("Select at least one staff"); return; }
    try {
      setLoading(true);
      const res = await api.post("/compliance/run-assignments", { onboardingOnly, staffIds: selectedStaff });
      setAssignmentResult(res.data.result);
      setActiveTab("assignment");
      toastr.success(res.data.message);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async () => {
    try {
      setLoading(true);
      const res = await api.post("/compliance/run-automation");
      setAutomationResult(res.data.result);
      setActiveTab("automation");
      toastr.success(res.data.message);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Automation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Run Compliance Assignments" subtitle="Manually assign compliance training to staff" />

      <div className="bg-surface border border-brand-border rounded-xl p-6 max-w-2xl space-y-5">

        {/* Onboarding toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="accent-emerald w-4 h-4"
            checked={onboardingOnly}
            onChange={(e) => setOnboardingOnly(e.target.checked)}
          />
          <span className="text-sm text-brand-text font-medium">Run for onboarding staff only</span>
        </label>

        {/* Staff list */}
        <div>
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Select Staff</label>
          <div className="border border-brand-border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
            {staff.length === 0 && <p className="text-brand-muted text-sm">No staff found</p>}
            {staff.map((s) =>
              s.inviteStatus === "accepted" ? (
                <label key={s._id} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-emerald w-3.5 h-3.5"
                    checked={selectedStaff.includes(s._id)}
                    onChange={() => toggleStaff(s._id)}
                  />
                  {s.user?.name}
                </label>
              ) : null
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            onClick={runAssignments}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Assignment"}
          </button>
          <button
            className="bg-charcoal hover:bg-charcoal-light text-white font-semibold text-sm uppercase tracking-wide px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            onClick={runAutomation}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Automation"}
          </button>
        </div>
      </div>

      {/* Results */}
      {(assignmentResult || automationResult) && (
        <>
          <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-max">
            {[{ key: "assignment", label: "Assignment Results" }, { key: "automation", label: "Automation Results" }].map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === key ? "bg-charcoal text-white" : "text-brand-muted hover:text-brand-text"}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "assignment" && assignmentResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon="fa-file-lines" label="Policies Processed" value={assignmentResult.policiesProcessed} />
              <StatCard icon="fa-list-check" label="Requested" value={assignmentResult.requested} />
              <StatCard icon="fa-circle-plus" label="New Assignments" value={assignmentResult.assignedCount} />
              <StatCard icon="fa-circle-check" label="Already Assigned" value={assignmentResult.alreadyAssignedCount} />
            </div>
          )}

          {activeTab === "automation" && automationResult && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard icon="fa-building" label="Orgs (Certs)" value={automationResult.certResult.organizationsProcessed} />
              <StatCard icon="fa-bell" label="Notifications Created" value={automationResult.certResult.notificationsCreated} />
              <StatCard icon="fa-triangle-exclamation" label="Expired Marked" value={automationResult.certResult.expiredMarked} danger />
              <StatCard icon="fa-building-columns" label="Orgs (Due)" value={automationResult.dueResult.organizationsProcessed} />
              <StatCard icon="fa-clock" label="Reminders Created" value={automationResult.dueResult.remindersCreated} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
