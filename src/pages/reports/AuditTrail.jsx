import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
export default function AuditTrail() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);
AOS.init({
      duration: 800,
      loop: true,
    });
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/reports/audit-trail",
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
        }
      );

      const data = await res.json();

      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  return (
    <section id="how-we-work" className="how-we-work section">
      <div className="container section-title">
        <h2>Audit Trail Logs</h2>
        <p>Recent system activities</p>
      </div>

      <div className="container">
        <div className="steps-wrapper">

          {logs.length === 0 && (
            <p>No logs found</p>
          )}

          {logs.map((log, index) => {
            const direction = index % 2 === 0 ? "fade-right" : "fade-left";

            return (
              <div
                key={log._id}
                className="step-item"
                data-aos={direction}
              >
                <div className="step-content">
                  <div className="step-icon">
                    <i className="bi bi-activity"></i>
                  </div>

                  <div className="step-info">
                    <span className="step-number">
                      Log {index + 1}
                    </span>

                    <h3>
                      {log.action} - {log.entityType}
                    </h3>

                    <p>
                      <strong>User:</strong> {log.userId} <br />
                      <strong>IP:</strong> {log.ipAddress} <br />
                      <strong>Date:</strong>{" "}
                      {new Date(log.createdAt).toLocaleString()} <br />

                      {log.metadata && (
                        <>
                          <strong>Metadata:</strong>{" "}
                          {JSON.stringify(log.metadata)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}