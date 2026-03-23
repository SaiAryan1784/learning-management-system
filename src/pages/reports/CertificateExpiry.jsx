import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function CertificateExpiry() {
  const tableRef = useRef();
  const dtRef = useRef();

  const [certificates, setCertificates] = useState([]);
  const [days, setDays] = useState(900);

  // ---------------- LOAD DATA ----------------
  const loadCertificates = async () => {
    try {
      const res = await api.get(
        `/reports/certificates/expiry?days=${days}`
      );

      setCertificates(res.data.rows || []);
    } catch (err) {
      toastr.error("Failed to load certificate expiry data");
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [days]);

  // ---------------- DATATABLE ----------------
  useEffect(() => {
    if (dtRef.current) {
      dtRef.current.clear().rows.add(certificates).draw();
      return;
    }

    dtRef.current = $(tableRef.current).DataTable({
      data: certificates,
      destroy: true,
      columns: [
        {
          title: "Name",
          data: "userName",
          defaultContent: "-",
        },
        {
          title: "Course",
          data: "courseName",
          defaultContent: "-",
        },
        {
          title: "Certificate",
          data: "certificateName",
          defaultContent: "-",
        },
        {
          title: "Expiry Date",
          data: "expiryDate",
          render: (data) =>
            data ? new Date(data).toLocaleDateString() : "-",
        },
        {
          title: "Days Left",
          data: "daysLeft",
          render: (data) =>
            data !== undefined ? `${data} days` : "-",
        },
      ],
    });
  }, [certificates]);

  return (
    <div className="mx-wd">
      {/* Header */}
      <div className="dash-tp">
        <h1 className="wlc-tl">CERTIFICATE EXPIRY</h1>
        <p className="wlc-ms">
          Track certificates that are about to expire.
        </p>
      </div>

      {/* Top Section */}
      <div className="tp-sc">
        <select
          className="login-ip"
          style={{ width: "200px" }}
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value={30}>Next 30 Days</option>
          <option value={60}>Next 60 Days</option>
          <option value={90}>Next 90 Days</option>
          <option value={180}>Next 180 Days</option>
          <option value={365}>Next 1 Year</option>
          <option value={900}>Next 900 Days</option>
        </select>

        <Link to="/dashboard" className="logout-btn">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
      </div>

      {/* Table */}
      <table
        ref={tableRef}
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Course</th>
            <th>Certificate</th>
            <th>Expiry Date</th>
            <th>Days Left</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      {/* Empty State */}
      {certificates.length === 0 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          No expiring certificates found
        </div>
      )}
    </div>
  );
}