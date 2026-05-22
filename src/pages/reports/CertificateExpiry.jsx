import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";

export default function CertificateExpiry() {
  const tableRef = useRef();
  const dtRef = useRef();
  const [certificates, setCertificates] = useState([]);
  const [days, setDays] = useState(900);

  const loadCertificates = async () => {
    try {
      const res = await api.get(`/reports/certificates/expiry?days=${days}`);
      setCertificates(res.data.rows || []);
    } catch {
      toastr.error("Failed to load certificate expiry data");
    }
  };

  useEffect(() => { loadCertificates(); }, [days]);

  useEffect(() => {
    if (dtRef.current) {
      dtRef.current.clear().rows.add(certificates).draw();
      return;
    }
    dtRef.current = $(tableRef.current).DataTable({
      data: certificates,
      destroy: true,
      columns: [
        { title: "Name", data: "userName", defaultContent: "-" },
        { title: "Course", data: "courseName", defaultContent: "-" },
        { title: "Certificate", data: "certificateName", defaultContent: "-" },
        { title: "Expiry Date", data: "expiryDate", render: (d) => d ? new Date(d).toLocaleDateString() : "-" },
        { title: "Days Left", data: "daysLeft", render: (d) => d !== undefined ? `${d} days` : "-" },
      ],
    });
  }, [certificates]);

  return (
    <div className="space-y-5">
      <PageHeader title="Certificate Expiry" subtitle="Track certificates that are about to expire">
        <select
          className="px-3 py-2 border border-brand-border rounded-lg text-xs text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent"
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
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 bg-charcoal-light hover:bg-charcoal-muted text-white/60 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </Link>
      </PageHeader>

      <TableContainer>
        <table ref={tableRef} width="100%">
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
      </TableContainer>

      {certificates.length === 0 && (
        <div className="bg-surface border border-brand-border rounded-xl p-12 text-center">
          <i className="fa-solid fa-certificate text-brand-muted text-3xl mb-3 block"></i>
          <p className="text-brand-muted text-sm">No expiring certificates found.</p>
        </div>
      )}
    </div>
  );
}
