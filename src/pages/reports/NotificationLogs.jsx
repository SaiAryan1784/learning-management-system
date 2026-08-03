import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionLoader } from "../../components/ui/Spinner";

export default function NotificationLogs() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(import.meta.env.VITE_API_URL + "/notifications/logs", {
        headers: { Authorization: "Bearer " + localStorage.getItem("accessToken") },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status === "sent") return "bg-emerald/10 text-emerald";
    if (status === "failed") return "bg-brand-danger/10 text-brand-danger";
    return "bg-amber-50 text-amber-600";
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Notification Logs" subtitle="Track all system notifications" />

      {loading ? (
        <SectionLoader />
      ) : notifications.length === 0 ? (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-bell-slash text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item, index) => (
            <div key={item._id} className="bg-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="fa-solid fa-bell text-xs text-icon"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">#{index + 1}</span>
                    <span className="text-sm font-semibold text-brand-text">{item.title}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-brand-muted space-y-0.5">
                    <p><span className="font-medium text-brand-text">Type:</span> {item.type} &bull; <span className="font-medium text-brand-text">Channel:</span> {item.channel}</p>
                    <p><span className="font-medium text-brand-text">Message:</span> {item.message}</p>
                    <p>
                      <span className="font-medium text-brand-text">Sent:</span> {item.sentAt ? new Date(item.sentAt).toLocaleString() : "N/A"} &bull;{" "}
                      <span className="font-medium text-brand-text">Read:</span> {item.readAt ? new Date(item.readAt).toLocaleString() : "Not Read"}
                    </p>
                    <p><span className="font-medium text-brand-text">Created:</span> {new Date(item.createdAt).toLocaleString()}</p>
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
