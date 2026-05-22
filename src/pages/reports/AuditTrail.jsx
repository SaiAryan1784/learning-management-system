import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAuditLogs(); }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(import.meta.env.VITE_API_URL + "/reports/audit-trail", {
        headers: { Authorization: "Bearer " + localStorage.getItem("accessToken") },
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Trail" subtitle="Recent system activities" />

      {loading ? (
        <SectionLoader />
      ) : logs.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-clipboard-list text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No audit logs found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div key={log._id} className="bg-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="fa-solid fa-bolt text-xs text-emerald"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Log {index + 1}</span>
                    <span className="text-sm font-semibold text-brand-text">{log.action} — {log.entityType}</span>
                  </div>
                  <div className="text-xs text-brand-muted space-y-0.5">
                    <p><span className="font-medium text-brand-text">User:</span> {log.userId}</p>
                    <p><span className="font-medium text-brand-text">IP:</span> {log.ipAddress}</p>
                    <p><span className="font-medium text-brand-text">Date:</span> {new Date(log.createdAt).toLocaleString()}</p>
                    {log.metadata && (
                      <p><span className="font-medium text-brand-text">Metadata:</span> {JSON.stringify(log.metadata)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
