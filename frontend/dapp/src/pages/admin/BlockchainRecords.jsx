import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

function getHeaders() {
  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    "";

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function valueOf(record, keys, fallback = "-") {
  for (const key of keys) {
    if (
      record &&
      record[key] !== undefined &&
      record[key] !== null &&
      record[key] !== ""
    ) {
      return record[key];
    }
  }
  return fallback;
}

function shortHash(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length <= 24) return text;
  return `${text.slice(0, 10)}...${text.slice(-10)}`;
}

function getStatus(record) {
  const landId = valueOf(record, ["blockchain_land_id"], "");
  const tx = valueOf(record, ["blockchain_tx_hash", "tx_hash"], "");
  const block = valueOf(
    record,
    ["blockchain_block_number", "block_number"],
    ""
  );

  if (landId && tx && block !== "") return "RECORDED";
  if (landId || tx || block !== "") return "PARTIAL";
  return "NOT RECORDED";
}

function Status({ status }) {
  const styles = {
    RECORDED: {
      background: "#ecfdf5",
      color: "#047857",
      border: "1px solid #a7f3d0",
    },
    PARTIAL: {
      background: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    },
    "NOT RECORDED": {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
  };

  return <span style={styles[status] || styles["NOT RECORDED"]}>{status}</span>;
}

export default function BlockchainRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  const loadRecords = async (initial = false) => {
    try {
      initial ? setLoading(true) : setRefreshing(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/lands`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load blockchain records"
        );
      }

      const lands = Array.isArray(data.lands) ? data.lands : [];

      // Only records that actually contain blockchain information.
      setRecords(
        lands.filter((land) =>
          Boolean(
            land.blockchain_land_id ||
              land.blockchain_tx_hash ||
              land.blockchain_block_number ||
              land.blockchain_network
          )
        )
      );
    } catch (err) {
      console.error("Blockchain records error:", err);
      setError(err.message || "Unable to load blockchain records");
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecords(true);
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();

    return records.filter((record) => {
      const status = getStatus(record);
      const network = String(
        valueOf(record, ["blockchain_network", "network"], "Unknown")
      );

      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (networkFilter !== "ALL" && network !== networkFilter) return false;

      if (!text) return true;

      return [
        record.id,
        record.land_id,
        record.owner_name,
        record.survey_number,
        record.blockchain_land_id,
        record.blockchain_tx_hash,
        record.blockchain_block_number,
        record.blockchain_network,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(text);
    });
  }, [records, search, statusFilter, networkFilter]);

  const networks = useMemo(() => {
    return [
      ...new Set(
        records.map((record) =>
          String(
            valueOf(record, ["blockchain_network", "network"], "Unknown")
          )
        )
      ),
    ];
  }, [records]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      recorded: records.filter((x) => getStatus(x) === "RECORDED").length,
      partial: records.filter((x) => getStatus(x) === "PARTIAL").length,
    };
  }, [records]);

  const copy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      alert("Copied to clipboard");
    } catch {
      alert("Unable to copy hash");
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading blockchain records...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Blockchain Records</h1>
          <p style={styles.subtitle}>
            View actual blockchain references stored against registered land.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadRecords(false)}
          disabled={refreshing}
          style={styles.refresh}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div style={styles.info}>
        <strong>Admin monitoring only.</strong>
        <span>
          This page does not verify land and does not approve sales. It only
          displays blockchain records already written by the application.
        </span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.stats}>
        <Stat label="Blockchain Records" value={stats.total} />
        <Stat label="Complete Records" value={stats.recorded} />
        <Stat label="Partial Records" value={stats.partial} />
      </div>

      <div style={styles.filters}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search land ID, owner, survey, transaction hash..."
          style={styles.input}
        />

        <select
          value={networkFilter}
          onChange={(e) => setNetworkFilter(e.target.value)}
          style={styles.select}
        >
          <option value="ALL">All Networks</option>
          {networks.map((network) => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="ALL">All Status</option>
          <option value="RECORDED">Recorded</option>
          <option value="PARTIAL">Partial</option>
        </select>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <strong>Land Blockchain Records</strong>
          <span>
            Showing {filtered.length} of {records.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.empty}>
            No blockchain records found.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Land ID</th>
                  <th style={styles.th}>Owner</th>
                  <th style={styles.th}>Survey</th>
                  <th style={styles.th}>Blockchain ID</th>
                  <th style={styles.th}>Transaction Hash</th>
                  <th style={styles.th}>Block</th>
                  <th style={styles.th}>Network</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, index) => {
                  const status = getStatus(record);
                  const txHash = valueOf(
                    record,
                    ["blockchain_tx_hash", "tx_hash"],
                    ""
                  );
                  const block = valueOf(
                    record,
                    ["blockchain_block_number", "block_number"],
                    "-"
                  );

                  return (
                    <tr key={record.id || record.land_id || index}>
                      <td style={styles.td}>
                        <strong>
                          {valueOf(record, ["land_id"], "-")}
                        </strong>
                      </td>
                      <td style={styles.td}>
                        {valueOf(record, ["owner_name"], "-")}
                      </td>
                      <td style={styles.td}>
                        {valueOf(record, ["survey_number"], "-")}
                      </td>
                      <td style={styles.td}>
                        {valueOf(record, ["blockchain_land_id"], "-")}
                      </td>
                      <td style={styles.td} title={txHash}>
                        <code>{shortHash(txHash)}</code>
                      </td>
                      <td style={styles.td}>{block}</td>
                      <td style={styles.td}>
                        {valueOf(record, ["blockchain_network", "network"], "-")}
                      </td>
                      <td style={styles.td}>
                        <Status status={status} />
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.view}
                          onClick={() => setSelected(record)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.eyebrow}>BLOCKCHAIN RECORD</div>
                <h2 style={styles.modalTitle}>
                  {valueOf(selected, ["land_id"], "Land Record")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={styles.close}
              >
                ×
              </button>
            </div>

            <div style={{ margin: "15px 0" }}>
              <Status status={getStatus(selected)} />
            </div>

            <div style={styles.grid}>
              <Detail label="Database ID" value={selected.id} />
              <Detail label="Land ID" value={selected.land_id} />
              <Detail label="Owner" value={selected.owner_name} />
              <Detail label="Survey Number" value={selected.survey_number} />
              <Detail label="District" value={selected.district} />
              <Detail label="Taluk" value={selected.taluk} />
              <Detail label="Village" value={selected.village} />
              <Detail label="Verification Status" value={selected.verification_status} />
              <Detail label="Blockchain Land ID" value={selected.blockchain_land_id} />
              <Detail label="Network" value={selected.blockchain_network || "Ganache Local"} />
              <Detail label="Block Number" value={selected.blockchain_block_number} />
              <Detail label="Owner Wallet" value={selected.wallet_address} mono />
            </div>

            <div style={styles.hashBox}>
              <span>Blockchain Transaction Hash</span>
              <code>
                {selected.blockchain_tx_hash || "Not available"}
              </code>
              {selected.blockchain_tx_hash && (
                <button
                  type="button"
                  onClick={() => copy(selected.blockchain_tx_hash)}
                  style={styles.copy}
                >
                  Copy Hash
                </button>
              )}
            </div>

            {selected.document_hash && (
              <div style={styles.hashBox}>
                <span>Document Hash</span>
                <code>{selected.document_hash}</code>
              </div>
            )}

            <div style={styles.note}>
              <strong>View only.</strong> No blockchain transaction is sent from
              this page.
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              style={styles.closeButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div style={styles.detail}>
      <span>{label}</span>
      <strong style={mono ? { fontFamily: "monospace", wordBreak: "break-all" } : {}}>
        {value || "-"}
      </strong>
    </div>
  );
}

const styles = {
  page: { width: "100%", color: "#172033" },
  loading: { padding: 50, textAlign: "center", color: "#64748b" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: 20, marginBottom: 20,
  },
  title: { margin: 0, fontSize: 28, fontWeight: 800 },
  subtitle: { margin: "7px 0 0", color: "#64748b", fontSize: 14 },
  refresh: {
    border: "1px solid #d7e1dc", background: "#fff", color: "#087c42",
    padding: "10px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer",
  },
  info: {
    display: "flex", gap: 10, alignItems: "center", padding: 14,
    borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0",
    marginBottom: 20, color: "#166534", fontSize: 13,
  },
  error: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    padding: 14, borderRadius: 8, marginBottom: 20,
  },
  stats: {
    display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 14, marginBottom: 20,
  },
  stat: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: 18, display: "flex", flexDirection: "column", gap: 8,
  },
  filters: { display: "flex", gap: 10, marginBottom: 16 },
  input: {
    flex: 1, border: "1px solid #dbe3ea", borderRadius: 8,
    padding: "11px 13px", outline: "none",
  },
  select: {
    width: 180, border: "1px solid #dbe3ea", borderRadius: 8,
    padding: "11px 13px", background: "#fff",
  },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    padding: "17px 18px", borderBottom: "1px solid #e5e7eb",
    display: "flex", justifyContent: "space-between",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", padding: "12px 14px", background: "#f8fafc",
    fontSize: 12, color: "#475569", whiteSpace: "nowrap",
  },
  td: { padding: "14px", borderTop: "1px solid #eef2f7", fontSize: 13 },
  view: {
    border: "1px solid #b7dec9", background: "#fff", color: "#087c42",
    borderRadius: 7, padding: "7px 13px", fontWeight: 700, cursor: "pointer",
  },
  empty: { padding: 50, textAlign: "center", color: "#64748b" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: 14, width: "min(900px,100%)",
    maxHeight: "90vh", overflowY: "auto", padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between" },
  eyebrow: { fontSize: 11, fontWeight: 800, color: "#087c42", letterSpacing: 1 },
  modalTitle: { margin: "5px 0 0", fontSize: 24 },
  close: { border: 0, background: "transparent", fontSize: 28, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 },
  detail: {
    border: "1px solid #e5e7eb", borderRadius: 9, padding: 12,
    display: "flex", flexDirection: "column", gap: 5,
  },
  hashBox: {
    marginTop: 15, padding: 14, borderRadius: 9, background: "#f8fafc",
    border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8,
  },
  copy: {
    alignSelf: "flex-start", border: "1px solid #cbd5e1", background: "#fff",
    padding: "7px 11px", borderRadius: 7, cursor: "pointer",
  },
  note: {
    marginTop: 15, padding: 13, background: "#f0fdf4",
    border: "1px solid #bbf7d0", borderRadius: 9, fontSize: 13,
  },
  closeButton: {
    marginTop: 18, border: 0, background: "#087c42", color: "#fff",
    padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer",
  },
};
