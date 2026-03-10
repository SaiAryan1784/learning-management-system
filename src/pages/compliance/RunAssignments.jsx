import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";

export default function RunAssignments() {
  /* ================= STATES ================= */
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [onboardingOnly, setOnboardingOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const [assignmentResult, setAssignmentResult] = useState(null);
  const [automationResult, setAutomationResult] = useState(null);

  const [activeTab, setActiveTab] = useState("assignment"); // assignment / automation

  /* ================= LOAD STAFF ================= */
  const loadStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaff(res.data.staff || []);
    } catch {
      toastr.error("Failed to load staff");
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  /* ================= STAFF CHECKBOX ================= */
  const toggleStaff = (id) => {
    setSelectedStaff(prev => {
      let updated = [...prev];
      if (updated.includes(id)) updated = updated.filter(s => s !== id);
      else updated.push(id);
      return updated;
    });
  };

  /* ================= RUN ASSIGNMENTS ================= */
  const runAssignments = async () => {
    if (selectedStaff.length === 0) {
      toastr.warning("Select at least one staff");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/compliance/run-assignments", {
        onboardingOnly,
        staffIds: selectedStaff
      });
      setAssignmentResult(res.data.result);
      setActiveTab("assignment");
      toastr.success(res.data.message);
    } catch (err) {
      toastr.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RUN AUTOMATION ================= */
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

  /* ================= UI ================= */
  return (
    <div className="mx-wd">

      <div className="dash-tp">
        <h1 className="wlc-tl">Run Compliance Assignments</h1>
        <p className="wlc-ms">Manually assign compliance training to staff</p>
      </div>

      <div className="tab-cnnt stats">
        <div style={{ maxWidth: "800px" }}>

          {/* ================= ONBOARDING TOGGLE ================= */}
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={onboardingOnly}
                onChange={(e) => setOnboardingOnly(e.target.checked)}
              />{" "}
              Run for onboarding staff only
            </label>
          </div>

          {/* ================= STAFF LIST ================= */}
          <div className="form-group">
            <label>Select Staff</label>
            <div style={{
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "15px",
              maxHeight: "250px",
              overflowY: "auto"
            }}>
              {staff.length === 0 && <p>No staff found</p>}
              {staff.map(s => (
                s.inviteStatus === "accepted" &&
                <div key={s._id} style={{ marginBottom: "8px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(s._id)}
                      onChange={() => toggleStaff(s._id)}
                    />{" "}
                    {s.user?.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* ================= BUTTONS SIDE BY SIDE ================= */}
          <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
            <button className="snd-btn" onClick={runAssignments} disabled={loading}>
              {loading ? "Running..." : "Run Assignment"}
            </button>

            <button className="snd-btn" onClick={runAutomation} disabled={loading}>
              {loading ? "Running..." : "Run Automation"}
            </button>
          </div>

          {/* ================= TABS ================= */}
          <div className="pg-tabs mt-4">
            <span
              className={`pg-tb ${activeTab === "assignment" ? "active-tab" : ""}`}
              onClick={() => setActiveTab("assignment")}
            >
              Assignment Results
            </span>

            <span
              className={`pg-tb ${activeTab === "automation" ? "active-tab" : ""}`}
              onClick={() => setActiveTab("automation")}
            >
              Automation Results
            </span>
          </div>

          {/* ================= RESULTS ================= */}
          <div className="mt-4">
            {activeTab === "assignment" && assignmentResult && (
              <div className="stats-grid">
                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{assignmentResult.policiesProcessed}</h3>
                    <p className="text-center">Policies Processed</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{assignmentResult.requested}</h3>
                    <p className="text-center">Requested</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{assignmentResult.assignedCount}</h3>
                    <p className="text-center">New Assignments</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{assignmentResult.alreadyAssignedCount}</h3>
                    <p className="text-center">Already Assigned</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "automation" && automationResult && (
              <div className="stats-grid">
                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{automationResult.certResult.organizationsProcessed}</h3>
                    <p className="text-center">Orgs Processed (Certs)</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{automationResult.certResult.notificationsCreated}</h3>
                    <p className="text-center">Notifications Created</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{automationResult.certResult.expiredMarked}</h3>
                    <p className="text-center">Expired Marked</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{automationResult.dueResult.organizationsProcessed}</h3>
                    <p className="text-center">Orgs Processed (Due)</p>
                  </div>
                </div>

                <div className="stats-card border">
                  <div className="stats-content">
                    <h3 className="stats-number text-center">{automationResult.dueResult.remindersCreated}</h3>
                    <p className="text-center">Reminders Created</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}