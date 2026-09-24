import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader, Button } from "../../components/ui";
import StaffCertificates from "./StaffCertificates";
import StaffBadges from "./StaffBadges";
import { PERM } from "../../auth/access";

// Unified "Recognition" page: Certificates + Badges under one route with two tabs.
// Replaces the two separate sidebar entries. Each child renders with `embedded` so
// this wrapper owns the single page header; the Manage shortcut follows the active tab.
const TABS = [
  { v: "certificates", label: "Certificates", icon: "fa-certificate" },
  { v: "badges", label: "Badges", icon: "fa-medal" },
];

export default function Recognition() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [tab, setTab] = useState("certificates");

  // Each tab's admin console needs its own permission: the certificates console
  // issues and revokes (or, for a location leader, views their team's), the
  // badge manager writes org settings.
  const canManage =
    tab === "certificates"
      ? hasPermission(PERM.certificatesTeam)
      : hasPermission(PERM.settingsUpdate);
  // A Franchise Owner or Manager reaches the same console read-only — say so.
  const manageLabel =
    tab === "certificates" && !hasPermission(PERM.certificatesManage) ? "Team Certificates" : "Manage";

  return (
    <div className="space-y-5">
      <PageHeader title="Recognition" subtitle="Your certificates and badges">
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            className="!text-white !border-white/20 hover:!bg-white/10"
            leadingIcon={<i className="fa-solid fa-gear text-xs" />}
            onClick={() =>
              navigate(
                tab === "certificates"
                  ? "/dashboard/certificates/manage"
                  : "/dashboard/badges/manage",
              )
            }
          >
            {manageLabel}
          </Button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-canvas border border-brand-border rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              tab === t.v
                ? "bg-surface text-brand-text shadow-soft"
                : "text-brand-muted hover:text-brand-text"
            }`}
          >
            <i className={`fa-solid ${t.icon} mr-1.5 text-xs`} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "certificates" ? <StaffCertificates embedded /> : <StaffBadges embedded />}
    </div>
  );
}
