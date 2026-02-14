import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/api";

export default function LocationsView() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { isSuperAdmin } = useAuth();

  const loadLocations = async () => {
    try {
      setLoading(true);
      let res;

      if (isSuperAdmin) {
        // SuperAdmin → fetch all locations (including owner info)
        // Assuming backend supports query param all=true to ignore org context
        res = await api.get("/locations?all=true");
      } else {
        // Owner → normal
        res = await api.get("/locations");
      }

      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Error loading locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  return (
    <div className="mx-wd">
      <h2>Locations (Read-Only)</h2>
      {loading ? (
        <p>Loading locations...</p>
      ) : (
        <table border="1" cellPadding="10" cellSpacing="0" width="100%">
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
                <td colSpan={isSuperAdmin ? 5 : 4} style={{ textAlign: "center" }}>
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
      )}
    </div>
  );
}
