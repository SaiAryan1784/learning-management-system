import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    api
      .get("/platform/organizations")
      .then((res) => setOrgs(res.data.organizations || []))
      .catch(() => toastr.error("Failed to load organizations"))
      .finally(() => setLoading(false));
  }, []);

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
      <div>
        <h2 className="text-lg font-bold text-brand-text">Platform Admin</h2>
        <p className="text-sm text-brand-muted mt-0.5">
          Switch into any client organization to manage on their behalf.
        </p>
      </div>

      {orgs.length === 0 ? (
        <p className="text-sm text-brand-muted">No organizations found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div
              key={org._id}
              className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-canvas px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-text truncate">
                  {org.name}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">
                  ID: {org._id}
                </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
