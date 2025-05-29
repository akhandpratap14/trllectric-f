import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

export default function AuditDashboard() {
  const [deviceId, setDeviceId] = useState("SOL-XL1001");
  const [telemetry, setTelemetry] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch telemetry records (last 25)
  async function fetchTelemetry(id) {
    try {
      const res = await fetch(`${API_BASE}/telemetry/${id}`);
      if (!res.ok) throw new Error("Failed to fetch telemetry");
      const data = await res.json();
      // Last 25 (latest first)
      setTelemetry(data.slice(-25).reverse());
    } catch (err) {
      setError(err.message);
    }
  }

  // Fetch stats (including discarded/duplicate counts)
  async function fetchStats(id) {
    try {
      const res = await fetch(`${API_BASE}/stats/${id}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Fetch active alerts
  async function fetchAlerts(id) {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}?active_only=true`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Load all data when deviceId changes
  useEffect(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      fetchTelemetry(deviceId),
      fetchStats(deviceId),
      fetchAlerts(deviceId),
    ]).finally(() => setLoading(false));
  }, [deviceId]);

  return (
    <div
      style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 800 }}
    >
      <h2>Minimal Audit Interface</h2>

      <label>
        Select Device:{" "}
        <input
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          style={{ padding: 5, marginBottom: 10 }}
        />
      </label>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {stats && (
        <div style={{ marginTop: 20 }}>
          <h3>Summary for device: {deviceId}</h3>
          <p>Total accepted records: {stats.total_entries}</p>
          <p>Duplicate records discarded: {stats.duplicates_count}</p>
          <p>Other discarded records: {stats.discarded_count}</p>
          <p>Active alerts: {alerts.length}</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Active Alerts</h3>
          <ul>
            {alerts.map((alert) => (
              <li key={alert.id}>
                <strong>{alert.alert_type}</strong> - {alert.details} (Triggered
                at: {new Date(alert.triggered_at).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Last 25 Telemetry Records</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>
                Timestamp
              </th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Voltage</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Current</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Power</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>
                Is Duplicate
              </th>
            </tr>
          </thead>
          <tbody>
            {telemetry.map((t, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {new Date(t.timestamp).toLocaleString()}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {t.voltage}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {t.current}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {t.power}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {t.is_duplicate ? "Yes" : "No"}
                </td>
              </tr>
            ))}
            {telemetry.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 8 }}>
                  No telemetry records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
