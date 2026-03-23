import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function NotificationLogs() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/notifications/logs",
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
        }
      );

      const data = await res.json();
    //   console.log("NOTIFICATIONS:", data);

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  return (
    <section className="how-we-work section">
      <div className="container section-title">
        <h2>Notification Logs</h2>
        <p>Track all system notifications</p>
      </div>

      <div className="container">
        <div className="steps-wrapper">

          {notifications.length === 0 && <p>No notifications found</p>}

          {notifications.map((item, index) => {
            const direction = index % 2 === 0 ? "fade-right" : "fade-left";

            return (
              <div
                key={item._id}
                className="step-item"
                data-aos={direction}
              >
                <div className="step-content">
                  <div className="step-icon">
                    <i className="bi bi-bell"></i>
                  </div>

                  <div className="step-info">
                    <span className="step-number">
                      #{index + 1}
                    </span>

                    <h3>{item.title}</h3>

                    <p>
                      <strong>Type:</strong> {item.type} <br />
                      <strong>Channel:</strong> {item.channel} <br />
                      <strong>Status:</strong>{" "}
                      <span
                        style={{
                          color:
                            item.status === "sent"
                              ? "green"
                              : item.status === "failed"
                              ? "red"
                              : "orange",
                        }}
                      >
                        {item.status}
                      </span>
                      <br />

                      <strong>Message:</strong> {item.message} <br />

                      <strong>Sent:</strong>{" "}
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleString()
                        : "N/A"}{" "}
                      <br />

                      <strong>Read:</strong>{" "}
                      {item.readAt
                        ? new Date(item.readAt).toLocaleString()
                        : "Not Read"}{" "}
                      <br />

                      <strong>Created:</strong>{" "}
                      {new Date(item.createdAt).toLocaleString()}
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