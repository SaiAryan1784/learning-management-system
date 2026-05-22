import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableContainer } from "../../components/ui/TableContainer";

export default function LocationsView() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin } = useAuth();

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get(isSuperAdmin ? "/locations?all=true" : "/locations");
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Error loading locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLocations(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Locations" subtitle="Read-only view of all locations" />

      {loading ? (
        <p className="text-brand-muted text-sm">Loading locations...</p>
      ) : (
        <TableContainer>
          <table width="100%">
            <thead>
              <tr>
                <th>Sr No</th>
                {isSuperAdmin && <th>Owner</th>}
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="text-center text-brand-muted py-8">
                    No locations found
                  </td>
                </tr>
              ) : (
                locations.map((loc, index) => (
                  <tr key={loc._id || index}>
                    <td>{index + 1}</td>
                    {isSuperAdmin && <td>{loc.ownerName || loc.owner?.name || "N/A"}</td>}
                    <td>{loc.name}</td>
                    <td>{loc.address}</td>
                    <td>{loc.phone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
