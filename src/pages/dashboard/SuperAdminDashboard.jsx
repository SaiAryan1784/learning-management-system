import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import { Button, SectionLoader } from "../../components/ui";
import toastr from "toastr";

export default function SuperAdminDashboard() {
  const { impersonate } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(null);
  const [editingSeats, setEditingSeats] = useState(null); // orgId being edited
  const [seatDraft, setSeatDraft] = useState("");
  const [savingSeats, setSavingSeats] = useState(false);

  const loadOrgs = () =>
    api
      .get("/platform/organizations")
      .then((res) => setOrgs(res.data.organizations || []))
      .catch(() => toastr.error("Failed to load organizations"))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadOrgs();
  }, []);

  const saveSeatLimit = async (orgId) => {
    const value = Number(seatDraft);
    if (!Number.isFinite(value) || value < 1) {
      toastr.error("Seat limit must be 1 or more");
      return;
    }
    try {
      setSavingSeats(true);
      await api.patch(`/platform/organizations/${orgId}`, {
        staffSeatLimit: Math.floor(value),
      });
      toastr.success("Seat limit updated");
      setEditingSeats(null);
      await loadOrgs();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Could not update seat limit");
    } finally {
      setSavingSeats(false);
    }
  };

  const handleSwitch = async (orgId, orgName) => {
    try {
      setSwitching(orgId);
      const res = await api.post(`/platform/switch-org/${orgId}`);
      impersonate(res.data);
      navigate("/dashboard");
    } catch (err) {
      toastr.error(err.response?.data?.message || "Failed to switch organization");
    } finally {
      setSwitching(null);
    }
  };

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-text">Platform Admin</h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Switch into any client organization to manage on their behalf.
          </p>
        </div>
        <Link to="/dashboard/organizations/new">
          <Button size="sm">
            <i className="fa-solid fa-circle-plus mr-1.5" />
            Add Client
          </Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <p className="text-sm text-brand-muted">No organizations found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div
              key={org._id}
              className="rounded-xl border border-brand-border bg-canvas px-4 py-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text truncate">
                    {org.name}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">ID: {org._id}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={switching === org._id}
                  onClick={() => handleSwitch(org._id, org.name)}
                >
                  Switch
                </Button>
              </div>

              {/* Seat usage. An org can legitimately sit ABOVE its limit if the
                  limit was lowered after the fact — show that honestly rather
                  than clamping the number. */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-brand-border">
                {editingSeats === org._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={seatDraft}
                      onChange={(e) => setSeatDraft(e.target.value)}
                      className="w-20 px-2 py-1 border border-brand-border rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald"
                    />
                    <Button
                      size="sm"
                      loading={savingSeats}
                      onClick={() => saveSeatLimit(org._id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSeats(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-xs ${
                        org.seats && org.seats.used >= org.seats.limit
                          ? "text-brand-danger font-semibold"
                          : "text-brand-muted"
                      }`}
                    >
                      <i className="fa-solid fa-users mr-1.5 text-[10px]" />
                      {org.seats
                        ? `${org.seats.used} of ${org.seats.limit} seats used`
                        : `Seat limit: ${org.staffSeatLimit ?? 5}`}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-emerald font-semibold hover:underline"
                      onClick={() => {
                        setEditingSeats(org._id);
                        setSeatDraft(String(org.seats?.limit ?? org.staffSeatLimit ?? 5));
                      }}
                    >
                      Change limit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
