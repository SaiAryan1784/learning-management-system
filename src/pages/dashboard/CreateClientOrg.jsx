import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Button } from "../../components/ui";

export default function CreateClientOrg() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/platform/create-org", {
        companyName: companyName.trim(),
        email: email.trim(),
        ownerName: ownerName.trim() || undefined,
        timezone,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (key, value) => {
    await navigator.clipboard.writeText(value);
    setCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
  };

  if (result) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h2 className="text-lg font-bold text-brand-text">Client Created</h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Save these credentials now — the password won't be shown again.
          </p>
        </div>

        <div className="rounded-xl border border-emerald/40 bg-emerald/5 p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald text-sm font-semibold">
            <i className="fa-solid fa-circle-check" />
            <span>{result.organization.name} created successfully</span>
          </div>

          <div className="space-y-3">
            <CredRow
              label="Email"
              value={result.email}
              copied={copied.email}
              onCopy={() => copyToClipboard("email", result.email)}
            />
            <CredRow
              label="Password"
              value={result.password}
              copied={copied.password}
              onCopy={() => copyToClipboard("password", result.password)}
            />
            <CredRow
              label="Org ID"
              value={result.organization.id}
              copied={copied.orgId}
              onCopy={() => copyToClipboard("orgId", result.organization.id)}
            />
          </div>
        </div>

        <p className="text-xs text-amber-500 flex items-start gap-1.5">
          <i className="fa-solid fa-triangle-exclamation mt-0.5" />
          Copy and share these credentials with the client before leaving this page.
        </p>

        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-bold text-brand-text">Add Client Organization</h2>
        <p className="text-sm text-brand-muted mt-0.5">
          Creates the org, owner account, and all default roles automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-text">Company Name *</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Lash and Company"
            required
            className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-emerald/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-text">Client Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. owner@lashandcompany.com"
            required
            className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-emerald/40"
          />
          <p className="text-xs text-brand-muted">Client's existing email — will become the owner login</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-text">Owner Name</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder={companyName ? `${companyName.trim()} Owner` : "Owner Name"}
            className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-emerald/40"
          />
          <p className="text-xs text-brand-muted">Optional — defaults to "Company Name Owner"</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-text">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="UTC"
            className="w-full rounded-lg border border-brand-border bg-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-emerald/40"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <i className="fa-solid fa-circle-xmark" />
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={loading} disabled={!companyName.trim() || !email.trim()}>
            Create Organization
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function CredRow({ label, value, copied, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface border border-brand-border px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-brand-muted">{label}</p>
        <p className="text-sm font-mono text-brand-text truncate">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="flex-shrink-0 text-xs text-brand-muted hover:text-brand-text transition-colors"
        title="Copy"
      >
        <i className={`fa-solid ${copied ? "fa-check text-emerald" : "fa-copy"}`} />
      </button>
    </div>
  );
}
