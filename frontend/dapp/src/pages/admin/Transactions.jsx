import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

function getAdminHeaders() {
  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    "";

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function valueOf(row, keys, fallback = "-") {
  for (const key of keys) {
    if (
      row &&
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ""
    ) {
      return row[key];
    }
  }
  return fallback;
}

function statusOf(row) {
  return String(
    valueOf(row, ["request_status", "status"], "PENDING")
  ).toUpperCase();
}

function hasBlockchainCompletion(row) {
  return Boolean(
    valueOf(row, [
      "blockchain_tx_hash",
      "blockchain_transaction_hash",
      "tx_hash",
    ], "")
  );
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);
  if (Number.isNaN(number)) return String(value);

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortHash(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length <= 24) return text;
  return `${text.slice(0, 10)}...${text.slice(-10)}`;
}

function Status({ status }) {
  const completed = status === "BLOCKCHAIN COMPLETED";
  const approved = status === "APPROVED";
  const rejected = status === "REJECTED";

  const style = completed
    ? styles.statusCompleted
    : approved
      ? styles.statusApproved
      : rejected
        ? styles.statusRejected
        : styles.statusPending;

  return <span style={style}>{status}</span>;
}

export default function Transactions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  const fetchRequests = async (initial = false) => {
    try {
      initial ? setLoading(true) : setRefreshing(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/buyer-requests`,
        {
          method: "GET",
          headers: getAdminHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load transactions"
        );
      }

      setRequests(
        Array.isArray(data.requests) ? data.requests : []
      );
    } catch (err) {
      console.error("Admin transactions error:", err);
      setError(err.message || "Unable to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests(true);
  }, []);

  const rows = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return requests
      .map((request) => {
        const requestStatus = statusOf(request);
        const blockchainCompleted =
          requestStatus === "APPROVED" &&
          hasBlockchainCompletion(request);

        return {
          ...request,
          displayStatus: blockchainCompleted
            ? "BLOCKCHAIN COMPLETED"
            : requestStatus,
          landId: valueOf(request, [
            "public_land_id",
            "land_identifier",
            "land_code",
            "land_id",
          ]),
          buyerName: valueOf(request, [
            "buyer_name",
            "buyerName",
          ]),
          buyerEmail: valueOf(request, [
            "buyer_email",
            "buyerEmail",
          ]),
          sellerName: valueOf(request, [
            "seller_name",
            "sellerName",
          ]),
          location: valueOf(request, [
            "location",
            "address",
            "village",
            "district",
          ]),
          surveyNumber: valueOf(request, [
            "survey_number",
          ]),
          amount: valueOf(request, [
            "sale_amount",
            "land_amount",
            "expected_sale_amount",
          ]),
          date: valueOf(request, [
            "updated_at",
            "requested_at",
            "request_date",
          ]),
          txHash: valueOf(request, [
            "blockchain_tx_hash",
            "blockchain_transaction_hash",
            "tx_hash",
          ], ""),
          blockchainLandId: valueOf(request, [
            "blockchain_land_id",
          ], ""),
          blockNumber: valueOf(request, [
            "blockchain_block_number",
            "block_number",
          ], ""),
          network: valueOf(request, [
            "blockchain_network",
            "network",
          ], "Ganache Local"),
          buyerWallet: valueOf(request, [
            "buyer_wallet_address",
            "buyer_wallet",
          ], "-"),
          sellerWallet: valueOf(request, [
            "seller_wallet_address",
            "seller_wallet",
          ], "-"),
        };
      })
      .filter((row) => {
        if (
          statusFilter !== "ALL" &&
          row.displayStatus !== statusFilter
        ) {
          return false;
        }

        if (!searchText) return true;

        return [
          row.id,
          row.request_id,
          row.landId,
          row.buyerName,
          row.buyerEmail,
          row.sellerName,
          row.location,
          row.surveyNumber,
          row.txHash,
          row.blockchainLandId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchText);
      });
  }, [requests, search, statusFilter]);

  const statistics = useMemo(() => {
    const normalized = requests.map((request) => {
      const status = statusOf(request);
      return {
        status,
        completed:
          status === "APPROVED" &&
          hasBlockchainCompletion(request),
      };
    });

    return {
      total: requests.length,
      pending: normalized.filter((x) => x.status === "PENDING").length,
      approved: normalized.filter((x) => x.status === "APPROVED").length,
      completed: normalized.filter((x) => x.completed).length,
      rejected: normalized.filter((x) => x.status === "REJECTED").length,
      cancelled: normalized.filter((x) => x.status === "CANCELLED").length,
    };
  }, [requests]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading transactions...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Transactions</h1>
          <p style={styles.subtitle}>
            Monitor buyer requests and completed blockchain ownership transfers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(false)}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div style={styles.info}>
        <strong>Admin is view-only on this page.</strong>
        <span>
          Buyer requests are accepted or rejected by the Seller. Admin does not
          approve or reject the sale here.
        </span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.statsGrid}>
        <Stat label="Total Requests" value={statistics.total} />
        <Stat label="Pending" value={statistics.pending} />
        <Stat label="Approved" value={statistics.approved} />
        <Stat label="Blockchain Completed" value={statistics.completed} />
        <Stat label="Rejected" value={statistics.rejected} />
      </div>

      <div style={styles.filters}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search buyer, seller, land ID, survey number..."
          style={styles.input}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="BLOCKCHAIN COMPLETED">Blockchain Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <strong>Transaction Records</strong>
          <span>Showing {rows.length} of {requests.length}</span>
        </div>

        {rows.length === 0 ? (
          <div style={styles.empty}>No transaction records found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Land</th>
                  <th style={styles.th}>Buyer</th>
                  <th style={styles.th}>Seller</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Request Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id || row.request_id || index}>
                    <td style={styles.td}>#{row.id || row.request_id || "-"}</td>
                    <td style={styles.td}>
                      <strong>{row.landId}</strong>
                      <div style={styles.small}>Survey: {row.surveyNumber}</div>
                    </td>
                    <td style={styles.td}>
                      <strong>{row.buyerName}</strong>
                      <div style={styles.small}>{row.buyerEmail}</div>
                    </td>
                    <td style={styles.td}>{row.sellerName}</td>
                    <td style={styles.td}>{formatAmount(row.amount)}</td>
                    <td style={styles.td}>{formatDate(row.date)}</td>
                    <td style={styles.td}>
                      <Status status={row.displayStatus} />
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.viewButton}
                        onClick={() => setSelected(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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
                <div style={styles.eyebrow}>TRANSACTION DETAILS</div>
                <h2 style={styles.modalTitle}>{selected.landId}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={styles.close}
              >
                ×
              </button>
            </div>

            <div style={styles.modalStatus}>
              <Status status={selected.displayStatus} />
            </div>

            <div style={styles.detailGrid}>
              <Detail label="Request ID" value={selected.id || selected.request_id} />
              <Detail label="Property ID" value={selected.landId} />
              <Detail label="Buyer" value={selected.buyerName} />
              <Detail label="Buyer Wallet" value={selected.buyerWallet} mono />
              <Detail label="Seller" value={selected.sellerName} />
              <Detail label="Seller Wallet" value={selected.sellerWallet} mono />
              <Detail label="Amount" value={formatAmount(selected.amount)} />
              <Detail label="Location" value={selected.location} />
              <Detail label="Survey Number" value={selected.surveyNumber} />
              <Detail label="Blockchain Land ID" value={selected.blockchainLandId || "Not available"} />
              <Detail label="Network" value={selected.network} />
              <Detail label="Block Number" value={selected.blockNumber || "Not available"} />
              <Detail label="Request Date" value={formatDate(selected.date)} />
            </div>

            <div style={styles.hashBox}>
              <span>Blockchain Transaction Hash</span>
              <code>{selected.txHash || "Not available — transaction has not completed on blockchain."}</code>
            </div>

            <div style={styles.note}>
              <strong>Admin action:</strong> View only. The Seller performs the
              sale approval through MetaMask and <code>approveSale()</code>.
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
        {value ?? "-"}
      </strong>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    color: "#172033",
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "#64748b",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 20,
  },
  title: { margin: 0, fontSize: 28, fontWeight: 800 },
  subtitle: { margin: "7px 0 0", color: "#64748b", fontSize: 14 },
  refreshButton: {
    border: "1px solid #d7e1dc",
    background: "#fff",
    color: "#087c42",
    padding: "10px 16px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  info: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    marginBottom: 20,
    color: "#166534",
    fontSize: 13,
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  stat: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 2px 8px rgba(15,23,42,.04)",
  },
  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    border: "1px solid #dbe3ea",
    borderRadius: 8,
    padding: "11px 13px",
    outline: "none",
  },
  select: {
    width: 190,
    border: "1px solid #dbe3ea",
    borderRadius: 8,
    padding: "11px 13px",
    background: "#fff",
  },
  tableCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    padding: "17px 18px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f8fafc",
    fontSize: 12,
    color: "#475569",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    borderTop: "1px solid #eef2f7",
    fontSize: 13,
    verticalAlign: "top",
  },
  small: { color: "#64748b", marginTop: 3, fontSize: 11 },
  viewButton: {
    border: "1px solid #b7dec9",
    background: "#fff",
    color: "#087c42",
    borderRadius: 7,
    padding: "7px 13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  statusPending: {
    display: "inline-block", padding: "5px 9px", borderRadius: 20,
    background: "#fff7ed", color: "#b45309", fontSize: 11, fontWeight: 800,
  },
  statusApproved: {
    display: "inline-block", padding: "5px 9px", borderRadius: 20,
    background: "#ecfdf5", color: "#047857", fontSize: 11, fontWeight: 800,
  },
  statusCompleted: {
    display: "inline-block", padding: "5px 9px", borderRadius: 20,
    background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 800,
  },
  statusRejected: {
    display: "inline-block", padding: "5px 9px", borderRadius: 20,
    background: "#fef2f2", color: "#b91c1c", fontSize: 11, fontWeight: 800,
  },
  empty: { padding: 50, textAlign: "center", color: "#64748b" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: 14, width: "min(900px, 100%)",
    maxHeight: "90vh", overflowY: "auto", padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: 15 },
  eyebrow: { fontSize: 11, fontWeight: 800, color: "#087c42", letterSpacing: 1 },
  modalTitle: { margin: "5px 0 0", fontSize: 24 },
  close: { border: 0, background: "transparent", fontSize: 28, cursor: "pointer" },
  modalStatus: { margin: "18px 0" },
  detailGrid: {
    display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12,
  },
  detail: {
    border: "1px solid #e5e7eb", borderRadius: 9, padding: 12,
    display: "flex", flexDirection: "column", gap: 5,
  },
  hashBox: {
    marginTop: 15, padding: 14, borderRadius: 9,
    background: "#f8fafc", border: "1px solid #e2e8f0",
    display: "flex", flexDirection: "column", gap: 8,
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
