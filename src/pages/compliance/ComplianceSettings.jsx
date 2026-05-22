import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";

export default function ComplianceSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    autoAssignOnStaffOnboarding: false,
    defaultDueDays: 30,
    certificateAlertDays: [30, 14, 7, 1],
    notificationChannels: { email: true, inApp: true },
  });

  const alertOptions = [60, 30, 14, 7, 1];

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/compliance/settings");
      setSettings({
        autoAssignOnStaffOnboarding: res.data?.autoAssignOnStaffOnboarding ?? false,
        defaultDueDays: res.data?.defaultDueDays ?? 30,
        certificateAlertDays: res.data?.certificateAlertDays ?? [30, 14, 7, 1],
        notificationChannels: res.data?.notificationChannels ?? { email: true, inApp: true },
      });
    } catch {
      toastr.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleAlertDay = (day) => {
    setSettings((prev) => {
      let days = [...prev.certificateAlertDays];
      days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
      return { ...prev, certificateAlertDays: days.sort((a, b) => b - a) };
    });
  };

  const toggleChannel = (channel) => {
    setSettings((prev) => ({
      ...prev,
      notificationChannels: { ...prev.notificationChannels, [channel]: !prev.notificationChannels[channel] },
    }));
  };

  const saveSettings = async () => {
    try {
      await api.put("/compliance/settings", settings);
      toastr.success("Compliance settings updated");
    } catch {
      toastr.error("Failed to update settings");
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-10 h-5 bg-brand-border rounded-full peer peer-checked:bg-emerald transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5"></div>
    </label>
  );

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-5">
      <PageHeader title="Compliance Settings" subtitle="Configure compliance rules for your organization" />

      <div className="bg-surface border border-brand-border rounded-xl p-6 max-w-2xl space-y-6">

        {/* Auto Assign */}
        <div className="flex items-center justify-between py-3 border-b border-brand-border">
          <div>
            <p className="text-sm font-semibold text-brand-text">Auto Assign on Onboarding</p>
            <p className="text-xs text-brand-muted mt-0.5">Automatically assign compliance courses when staff joins</p>
          </div>
          <Toggle
            checked={settings.autoAssignOnStaffOnboarding}
            onChange={(e) => setSettings((p) => ({ ...p, autoAssignOnStaffOnboarding: e.target.checked }))}
          />
        </div>

        {/* Default Due Days */}
        <div className="py-3 border-b border-brand-border">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Default Due Days</label>
          <input
            type="number"
            name="defaultDueDays"
            value={settings.defaultDueDays}
            onChange={handleChange}
            className="w-32 px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
          />
        </div>

        {/* Certificate Alert Days */}
        <div className="py-3 border-b border-brand-border">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-3">Certificate Expiry Alerts</label>
          <div className="flex flex-wrap gap-2">
            {alertOptions.map((day) => (
              <label
                key={day}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-semibold ${
                  settings.certificateAlertDays.includes(day)
                    ? "bg-emerald/10 border-emerald text-emerald"
                    : "border-brand-border text-brand-muted hover:border-emerald/40"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={settings.certificateAlertDays.includes(day)} onChange={() => toggleAlertDay(day)} />
                {day} Days Before
              </label>
            ))}
          </div>
        </div>

        {/* Notification Channels */}
        <div className="py-3">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-3">Notification Channels</label>
          <div className="flex gap-6">
            {[{ key: "email", label: "Email" }, { key: "inApp", label: "In App" }].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Toggle checked={settings.notificationChannels[key]} onChange={() => toggleChannel(key)} />
                <span className="text-sm text-brand-text font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="bg-emerald hover:bg-emerald-hover text-white font-semibold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
          onClick={saveSettings}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
