import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token")
    );
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Admin session not found. Please login again.");
      }

      const response = await fetch(
        `${API_URL}/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load dashboard"
        );
      }

      setDashboard(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const root =
    dashboard?.statistics ||
    dashboard?.data?.statistics ||
    dashboard?.data ||
    dashboard ||
    {};

  const users = root.users || {};
  const lands = root.lands || {};
  const transactions = root.transactions || {};

  const totalUsers =
    root.totalUsers ?? users.total ?? 0;

  const sellers =
    root.sellers ?? users.sellers ?? 0;

  const buyers =
    root.buyers ?? users.buyers ?? 0;

  const totalProperties =
    root.totalProperties ??
    root.totalLands ??
    lands.total ??
    0;

  const pendingProperties =
    root.pendingProperties ??
    root.pendingLands ??
    lands.pending ??
    0;

  const verifiedProperties =
    root.verifiedProperties ??
    root.verifiedLands ??
    lands.verified ??
    0;

  const rejectedProperties =
    root.rejectedProperties ??
    root.rejectedLands ??
    lands.rejected ??
    0;

  const totalTransactions =
    root.totalTransactions ??
    transactions.total ??
    0;

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const verificationRate =
    totalProperties > 0
      ? Math.round(
          (verifiedProperties / totalProperties) * 100
        )
      : 0;

  const pendingRate =
    totalProperties > 0
      ? Math.round(
          (pendingProperties / totalProperties) * 100
        )
      : 0;

  const rejectedRate =
    totalProperties > 0
      ? Math.round(
          (rejectedProperties / totalProperties) * 100
        )
      : 0;

  /*
   * ============================================================
   * BAR CHART HEIGHTS
   *
   * These are calculated from REAL backend values.
   * The largest value becomes 100%.
   * No sample/fake values are used.
   * ============================================================
   */

  const maxLandChartValue = Math.max(
    Number(totalProperties || 0),
    Number(verifiedProperties || 0),
    Number(pendingProperties || 0),
    Number(rejectedProperties || 0),
    1
  );

  const getBarHeight = (value) => {
    const numericValue = Number(value || 0);

    if (numericValue === 0) {
      return 0;
    }

    return Math.max(
      8,
      Math.round(
        (numericValue / maxLandChartValue) * 100
      )
    );
  };

  return (
    <>
      <style>{`
        /* =========================================================
           ADMIN DASHBOARD
           SAME DESIGN SYSTEM AS SELLER MODULE
        ========================================================= */

        .admin-dashboard-page {
          min-height: calc(100vh - 70px);
          background: #f5f7fb;
        }

        .admin-dashboard-content {
          padding: 24px 30px 45px;
          max-width: 1600px;
          margin: auto;
        }

        /* =========================================================
           PAGE HEADER
        ========================================================= */

        .admin-page-heading {
          margin-bottom: 20px;
        }

        .admin-page-heading h1 {
          margin: 0;
          font-size: 23px;
          font-weight: 700;
          color: #172033;
        }

        .admin-page-heading p {
          margin: 6px 0 0;
          color: #687386;
          font-size: 14px;
        }

        /* =========================================================
           WELCOME
        ========================================================= */

        .admin-welcome-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 21px;
        }

        .admin-welcome-row h2 {
          margin: 0;
          font-size: 22px;
          color: #172033;
        }

        .admin-welcome-row p {
          margin: 5px 0 0;
          color: #687386;
          font-size: 14px;
        }

        .admin-status-chip {
          background: #fff;
          border: 1px solid #e3e9ee;
          border-radius: 20px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #475467;
          white-space: nowrap;
        }

        .admin-status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #159447;
          margin-right: 7px;
        }

        /* =========================================================
           ERROR
        ========================================================= */

        .admin-error {
          padding: 12px 14px;
          background: #fff0ef;
          border: 1px solid #f2c2bf;
          border-radius: 8px;
          color: #b42318;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .admin-retry-button {
          height: 31px;
          border: 1px solid #d8dee6;
          background: #fff;
          color: #344054;
          border-radius: 6px;
          padding: 0 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-retry-button:hover {
          border-color: #159447;
          color: #159447;
        }

        /* =========================================================
           STATISTICS
        ========================================================= */

        .admin-stats-grid {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .admin-stat-card {
          min-height: 114px;
          border: 1px solid #e5e9ef;
          background: #fff;
          border-radius: 11px;
          padding: 18px 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow:
            0 3px 12px rgba(15,23,42,.035);
          transition: .2s;
          min-width: 0;
        }

        .admin-stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 20px rgba(15,23,42,.07);
        }

        .admin-stat-icon {
          width: 58px;
          height: 58px;
          min-width: 58px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
        }

        .admin-stat-icon.green {
          background: #dff6e6;
          color: #159447;
        }

        .admin-stat-icon.blue {
          background: #e0ebff;
          color: #2c6bed;
        }

        .admin-stat-icon.yellow {
          background: #fff0cb;
          color: #e79500;
        }

        .admin-stat-icon.purple {
          background: #eee4ff;
          color: #7040d8;
        }

        .admin-stat-icon.red {
          background: #ffe2e0;
          color: #db4440;
        }

        .admin-stat-content {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .admin-stat-content .admin-stat-label {
          display: block;
          font-size: 12px;
          color: #455064;
          margin-bottom: 4px;
          white-space: normal;
        }

        .admin-stat-content .admin-stat-value {
          display: block;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 700;
          color: #111827;
        }

        .admin-stat-content .admin-stat-sub {
          display: block;
          color: #159447;
          font-size: 10px;
          margin-top: 5px;
          line-height: 1.35;
          white-space: normal;
        }

        /* =========================================================
           REAL LAND STATUS BAR CHART
        ========================================================= */

        .admin-bar-chart-panel {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 11px;
          box-shadow:
            0 3px 14px rgba(15,23,42,.035);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .admin-bar-chart-header {
          min-height: 61px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #edf0f3;
        }

        .admin-bar-chart-header h2 {
          margin: 0;
          font-size: 17px;
          color: #172033;
        }

        .admin-bar-chart-header span {
          display: block;
          margin-top: 4px;
          color: #98a2b3;
          font-size: 10px;
        }

        .admin-bar-chart-total {
          font-size: 11px;
          font-weight: 700;
          color: #159447;
          background: #e7f7ee;
          border: 1px solid #cdebd8;
          border-radius: 20px;
          padding: 7px 11px;
          white-space: nowrap;
        }

        .admin-bar-chart-body {
          padding: 22px 24px 20px;
        }

        .admin-bar-chart {
          height: 280px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 25px;
          position: relative;
          padding: 0 18px 0 18px;
          border-bottom: 1px solid #dfe5ea;
          background:
            repeating-linear-gradient(
              to top,
              transparent 0,
              transparent 55px,
              #f0f3f5 56px
            );
        }

        .admin-bar-item {
          height: 100%;
          flex: 1;
          max-width: 150px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-direction: column;
          position: relative;
        }

        .admin-bar-value {
          font-size: 12px;
          font-weight: 700;
          color: #172033;
          margin-bottom: 7px;
          min-height: 17px;
        }

        .admin-bar {
          width: min(72px, 75%);
          min-height: 0;
          border-radius: 8px 8px 0 0;
          transition:
            height .45s ease,
            transform .2s ease;
        }

        .admin-bar:hover {
          transform: translateY(-3px);
        }

        .admin-bar.total {
          background: #7040d8;
        }

        .admin-bar.verified {
          background: #159447;
        }

        .admin-bar.pending {
          background: #e79500;
        }

        .admin-bar.rejected {
          background: #db4440;
        }

        .admin-bar-label {
          margin-top: 10px;
          margin-bottom: 13px;
          text-align: center;
          color: #475467;
          font-size: 11px;
          font-weight: 600;
        }

        .admin-bar-chart-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 17px;
        }

        .admin-chart-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #667085;
          font-size: 10px;
        }

        .admin-chart-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
        }

        .admin-chart-legend-dot.total {
          background: #7040d8;
        }

        .admin-chart-legend-dot.verified {
          background: #159447;
        }

        .admin-chart-legend-dot.pending {
          background: #e79500;
        }

        .admin-chart-legend-dot.rejected {
          background: #db4440;
        }

        /* =========================================================
           PANELS
        ========================================================= */

        .admin-dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr .9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .admin-panel {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 11px;
          box-shadow:
            0 3px 14px rgba(15,23,42,.035);
          overflow: hidden;
          min-width: 0;
        }

        .admin-panel-header {
          min-height: 61px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #edf0f3;
        }

        .admin-panel-header h2 {
          margin: 0;
          font-size: 17px;
          color: #172033;
        }

        .admin-panel-header span {
          color: #98a2b3;
          font-size: 10px;
        }

        .admin-panel-body {
          padding: 20px;
        }

        .admin-outline-button {
          height: 32px;
          padding: 0 12px;
          background: #fff;
          border: 1px solid #d8dee6;
          border-radius: 6px;
          color: #334155;
          font-size: 11px;
          cursor: pointer;
        }

        .admin-outline-button:hover {
          border-color: #159447;
          color: #159447;
        }

        /* =========================================================
           LAND VERIFICATION
        ========================================================= */

        .admin-verification-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .admin-verification-box {
          border: 1px solid #e5e9ef;
          border-radius: 9px;
          padding: 17px;
          min-width: 0;
        }

        .admin-verification-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }

        .admin-verification-label {
          color: #687386;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .admin-verification-value {
          color: #111827;
          font-size: 23px;
          font-weight: 700;
        }

        .admin-verification-icon {
          width: 35px;
          height: 35px;
          border-radius: 8px;
          background: #f3f5f7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .admin-progress {
          width: 100%;
          height: 7px;
          background: #f0f2f4;
          border-radius: 20px;
          overflow: hidden;
        }

        .admin-progress-fill {
          height: 100%;
          border-radius: 20px;
          background: #159447;
          transition: width .4s ease;
        }

        .admin-progress-fill.pending {
          background: #e79500;
        }

        .admin-progress-fill.rejected {
          background: #db4440;
        }

        .admin-verification-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid #edf0f3;
        }

        .admin-summary-item {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .admin-summary-item span {
          color: #98a2b3;
          font-size: 10px;
        }

        .admin-summary-item strong {
          margin-top: 4px;
          color: #172033;
          font-size: 18px;
        }

        /* =========================================================
           USER DISTRIBUTION
        ========================================================= */

        .admin-user-chart {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          margin: 5px auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            conic-gradient(
              #159447 0deg,
              #159447 ${totalUsers > 0
                ? Math.round((sellers / totalUsers) * 360)
                : 0}deg,
              #2c6bed ${totalUsers > 0
                ? Math.round((sellers / totalUsers) * 360)
                : 0}deg,
              #2c6bed 360deg
            );
        }

        .admin-user-chart-inner {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .admin-user-chart-inner strong {
          font-size: 28px;
          color: #172033;
        }

        .admin-user-chart-inner span {
          margin-top: 3px;
          font-size: 9px;
          color: #98a2b3;
          letter-spacing: 1px;
        }

        .admin-user-list {
          display: flex;
          flex-direction: column;
        }

        .admin-user-row {
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #edf0f3;
        }

        .admin-user-row:last-child {
          border-bottom: 0;
        }

        .admin-user-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475467;
          font-size: 12px;
        }

        .admin-user-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .admin-user-dot.green {
          background: #159447;
        }

        .admin-user-dot.blue {
          background: #2c6bed;
        }

        .admin-user-row > strong {
          font-size: 13px;
          color: #172033;
        }

        /* =========================================================
           QUICK ACTIONS
        ========================================================= */

        .admin-quick-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .admin-quick-card {
          min-height: 92px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          background: #fff;
          text-decoration: none;
          color: #172033;
          transition: .2s;
          min-width: 0;
        }

        .admin-quick-card:hover {
          border-color: #a8dfbc;
          background: #f8fcf9;
          transform: translateY(-2px);
        }

        .admin-quick-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
        }

        .admin-quick-icon.green {
          background: #dff6e6;
          color: #159447;
        }

        .admin-quick-icon.blue {
          background: #e0ebff;
          color: #2c6bed;
        }

        .admin-quick-icon.yellow {
          background: #fff0cb;
          color: #e79500;
        }

        .admin-quick-icon.purple {
          background: #eee4ff;
          color: #7040d8;
        }

        .admin-quick-content {
          flex: 1;
          min-width: 0;
        }

        .admin-quick-content strong {
          display: block;
          font-size: 12px;
          color: #172033;
        }

        .admin-quick-content span {
          display: block;
          margin-top: 4px;
          color: #98a2b3;
          font-size: 9px;
          line-height: 1.45;
        }

        .admin-quick-arrow {
          color: #159447;
          font-size: 17px;
          flex: none;
        }

        /* =========================================================
           LAND STATUS
        ========================================================= */

        .admin-land-status {
          display: flex;
          flex-direction: column;
        }

        .admin-land-status-row {
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #edf0f3;
        }

        .admin-land-status-row:last-child {
          border-bottom: 0;
        }

        .admin-land-status-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .admin-land-status-icon {
          width: 35px;
          height: 35px;
          min-width: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .admin-land-status-icon.pending {
          background: #fff0cb;
          color: #e79500;
        }

        .admin-land-status-icon.verified {
          background: #dff6e6;
          color: #159447;
        }

        .admin-land-status-icon.rejected {
          background: #ffe2e0;
          color: #db4440;
        }

        .admin-land-status-text {
          min-width: 0;
        }

        .admin-land-status-text strong {
          display: block;
          font-size: 12px;
          color: #172033;
        }

        .admin-land-status-text small {
          display: block;
          margin-top: 3px;
          font-size: 9px;
          color: #98a2b3;
        }

        .admin-land-status-row > strong {
          font-size: 13px;
          color: #172033;
        }

        /* =========================================================
           WORKFLOW
        ========================================================= */

        .admin-workflow {
          display: flex;
          flex-direction: column;
        }

        .admin-workflow-step {
          display: flex;
          align-items: flex-start;
          gap: 11px;
        }

        .admin-workflow-number {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 50%;
          background: #e7f7ee;
          color: #159447;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .admin-workflow-text {
          padding-top: 2px;
          display: flex;
          flex-direction: column;
        }

        .admin-workflow-text strong {
          font-size: 11px;
          color: #344054;
        }

        .admin-workflow-text span {
          margin-top: 4px;
          color: #667085;
          font-size: 9px;
          line-height: 1.5;
        }

        .admin-workflow-line {
          width: 1px;
          height: 20px;
          margin-left: 14px;
          background: #dce5df;
        }

        /* =========================================================
           SYSTEM ACTIVITY
        ========================================================= */

        .admin-activity-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .admin-activity-card {
          min-height: 80px;
          border: 1px solid #e5e9ef;
          border-radius: 9px;
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .admin-activity-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 700;
        }

        .admin-activity-icon.green {
          background: #dff6e6;
          color: #159447;
        }

        .admin-activity-icon.blue {
          background: #e0ebff;
          color: #2c6bed;
        }

        .admin-activity-icon.yellow {
          background: #fff0cb;
          color: #e79500;
        }

        .admin-activity-icon.purple {
          background: #eee4ff;
          color: #7040d8;
        }

        .admin-activity-card span {
          display: block;
          color: #687386;
          font-size: 10px;
        }

        .admin-activity-card strong {
          display: block;
          margin-top: 4px;
          color: #172033;
          font-size: 18px;
        }

        /* =========================================================
           LOADING
        ========================================================= */

        .admin-loading {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          color: #667085;
          font-size: 13px;
        }

        .admin-loading-spinner {
          width: 35px;
          height: 35px;
          border: 3px solid #e4eee8;
          border-top-color: #159447;
          border-radius: 50%;
          animation: adminSpin .8s linear infinite;
        }

        @keyframes adminSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================================================
           RESPONSIVE
        ========================================================= */

        @media(max-width:1200px) {

          .admin-stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .admin-dashboard-grid {
            grid-template-columns: 1fr;
          }

          .admin-quick-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-activity-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media(max-width:850px) {

          .admin-dashboard-content {
            padding: 18px;
          }

          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-verification-grid {
            grid-template-columns: 1fr 1fr;
          }

          .admin-bar-chart {
            gap: 10px;
            padding-left: 5px;
            padding-right: 5px;
          }

          .admin-bar {
            width: 55px;
          }

        }

        @media(max-width:600px) {

          .admin-stats-grid {
            grid-template-columns: 1fr;
          }

          .admin-verification-grid {
            grid-template-columns: 1fr;
          }

          .admin-quick-grid {
            grid-template-columns: 1fr;
          }

          .admin-activity-grid {
            grid-template-columns: 1fr;
          }

          .admin-welcome-row {
            flex-direction: column;
          }

          .admin-status-chip {
            white-space: normal;
          }

          .admin-verification-summary {
            grid-template-columns: 1fr;
          }

          .admin-panel-header {
            min-height: 55px;
          }

          .admin-panel-body {
            padding: 15px;
          }

          .admin-page-heading h1 {
            font-size: 20px;
          }

          .admin-welcome-row h2 {
            font-size: 19px;
          }

          .admin-error {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-bar-chart-header {
            align-items: flex-start;
            flex-direction: column;
            padding-top: 14px;
            padding-bottom: 14px;
          }

          .admin-bar-chart {
            height: 230px;
            gap: 4px;
            padding-left: 0;
            padding-right: 0;
          }

          .admin-bar {
            width: 42px;
          }

          .admin-bar-label {
            font-size: 9px;
          }

          .admin-bar-chart-legend {
            gap: 10px;
          }

        }
      `}</style>

      <div className="admin-dashboard-page">

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            Loading administrator dashboard...
          </div>
        ) : (
          <div className="admin-dashboard-content">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="admin-page-heading">

              <h1>
                Administrator Dashboard
              </h1>

              <p>
                Monitor users, land registrations,
                verification requests and blockchain activity.
              </p>

            </div>


            {/* =====================================================
                ERROR
            ===================================================== */}

            {error && (
              <div className="admin-error">

                <span>
                  {error}
                </span>

                <button
                  className="admin-retry-button"
                  onClick={fetchDashboard}
                >
                  Retry
                </button>

              </div>
            )}


            {/* =====================================================
                SYSTEM OVERVIEW
            ===================================================== */}

            <div className="admin-welcome-row">

              <div>

                <h2>
                  System Overview
                </h2>

                <p>
                  Current land registry statistics from
                  the database.
                </p>

              </div>

              <div className="admin-status-chip">

                <span className="admin-status-dot"></span>

                System Secure

              </div>

            </div>


            {/* =====================================================
                STAT CARDS
            ===================================================== */}

            <div className="admin-stats-grid">


              {/* TOTAL USERS */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon green">
                  ♙
                </div>

                <div className="admin-stat-content">

                  <span className="admin-stat-label">
                    Total Users
                  </span>

                  <strong className="admin-stat-value">
                    {formatNumber(totalUsers)}
                  </strong>

                  <span className="admin-stat-sub">
                    {formatNumber(sellers)} Sellers ·{" "}
                    {formatNumber(buyers)} Buyers
                  </span>

                </div>

              </div>


              {/* SELLERS */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon green">
                  ♙
                </div>

                <div className="admin-stat-content">

                  <span className="admin-stat-label">
                    Sellers
                  </span>

                  <strong className="admin-stat-value">
                    {formatNumber(sellers)}
                  </strong>

                  <span className="admin-stat-sub">
                    Registered sellers
                  </span>

                </div>

              </div>


              {/* BUYERS */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon blue">
                  ♙
                </div>

                <div className="admin-stat-content">

                  <span className="admin-stat-label">
                    Buyers
                  </span>

                  <strong className="admin-stat-value">
                    {formatNumber(buyers)}
                  </strong>

                  <span className="admin-stat-sub">
                    Registered buyers
                  </span>

                </div>

              </div>


              {/* LAND */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon purple">
                  ◇
                </div>

                <div className="admin-stat-content">

                  <span className="admin-stat-label">
                    Total Lands
                  </span>

                  <strong className="admin-stat-value">
                    {formatNumber(totalProperties)}
                  </strong>

                  <span className="admin-stat-sub">
                    Registered properties
                  </span>

                </div>

              </div>


              {/* PENDING */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon yellow">
                  !
                </div>

                <div className="admin-stat-content">

                  <span className="admin-stat-label">
                    Pending Review
                  </span>

                  <strong className="admin-stat-value">
                    {formatNumber(pendingProperties)}
                  </strong>

                  <span className="admin-stat-sub">
                    Need verification
                  </span>

                </div>

              </div>

            </div>


            {/* =====================================================
                REAL LAND STATUS BAR CHART
            ===================================================== */}

            <div className="admin-bar-chart-panel">

              <div className="admin-bar-chart-header">

                <div>

                  <h2>
                    Land Registry Overview
                  </h2>

                  <span>
                    Current land records by verification status
                  </span>

                </div>

                <div className="admin-bar-chart-total">
                  Total: {formatNumber(totalProperties)}
                </div>

              </div>


              <div className="admin-bar-chart-body">

                <div className="admin-bar-chart">


                  {/* TOTAL */}

                  <div className="admin-bar-item">

                    <div className="admin-bar-value">
                      {formatNumber(totalProperties)}
                    </div>

                    <div
                      className="admin-bar total"
                      style={{
                        height: `${getBarHeight(
                          totalProperties
                        )}%`,
                      }}
                    />

                    <div className="admin-bar-label">
                      Total Lands
                    </div>

                  </div>


                  {/* VERIFIED */}

                  <div className="admin-bar-item">

                    <div className="admin-bar-value">
                      {formatNumber(verifiedProperties)}
                    </div>

                    <div
                      className="admin-bar verified"
                      style={{
                        height: `${getBarHeight(
                          verifiedProperties
                        )}%`,
                      }}
                    />

                    <div className="admin-bar-label">
                      Verified
                    </div>

                  </div>


                  {/* PENDING */}

                  <div className="admin-bar-item">

                    <div className="admin-bar-value">
                      {formatNumber(pendingProperties)}
                    </div>

                    <div
                      className="admin-bar pending"
                      style={{
                        height: `${getBarHeight(
                          pendingProperties
                        )}%`,
                      }}
                    />

                    <div className="admin-bar-label">
                      Pending
                    </div>

                  </div>


                  {/* REJECTED */}

                  <div className="admin-bar-item">

                    <div className="admin-bar-value">
                      {formatNumber(rejectedProperties)}
                    </div>

                    <div
                      className="admin-bar rejected"
                      style={{
                        height: `${getBarHeight(
                          rejectedProperties
                        )}%`,
                      }}
                    />

                    <div className="admin-bar-label">
                      Rejected
                    </div>

                  </div>

                </div>


                {/* CHART LEGEND */}

                <div className="admin-bar-chart-legend">

                  <div className="admin-chart-legend-item">

                    <span className="admin-chart-legend-dot total"></span>

                    Total Lands

                  </div>

                  <div className="admin-chart-legend-item">

                    <span className="admin-chart-legend-dot verified"></span>

                    Verified

                  </div>

                  <div className="admin-chart-legend-item">

                    <span className="admin-chart-legend-dot pending"></span>

                    Pending

                  </div>

                  <div className="admin-chart-legend-item">

                    <span className="admin-chart-legend-dot rejected"></span>

                    Rejected

                  </div>

                </div>

              </div>

            </div>


            {/* =====================================================
                LAND + USERS
            ===================================================== */}

            <div className="admin-dashboard-grid">


              {/* LAND VERIFICATION */}

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>

                    <h2>
                      Land Verification
                    </h2>

                    <span>
                      Current property status
                    </span>

                  </div>

                  <button
                    className="admin-outline-button"
                    onClick={fetchDashboard}
                  >
                    ↻ Refresh
                  </button>

                </div>


                <div className="admin-panel-body">

                  <div className="admin-verification-grid">


                    {/* PENDING */}

                    <div className="admin-verification-box">

                      <div className="admin-verification-top">

                        <div>

                          <div className="admin-verification-label">
                            Pending
                          </div>

                          <div className="admin-verification-value">
                            {formatNumber(
                              pendingProperties
                            )}
                          </div>

                        </div>

                        <div className="admin-verification-icon">
                          ◷
                        </div>

                      </div>

                      <div className="admin-progress">

                        <div
                          className="admin-progress-fill pending"
                          style={{
                            width: `${pendingRate}%`,
                          }}
                        />

                      </div>

                    </div>


                    {/* VERIFIED */}

                    <div className="admin-verification-box">

                      <div className="admin-verification-top">

                        <div>

                          <div className="admin-verification-label">
                            Verified
                          </div>

                          <div className="admin-verification-value">
                            {formatNumber(
                              verifiedProperties
                            )}
                          </div>

                        </div>

                        <div className="admin-verification-icon">
                          ✓
                        </div>

                      </div>

                      <div className="admin-progress">

                        <div
                          className="admin-progress-fill"
                          style={{
                            width: `${verificationRate}%`,
                          }}
                        />

                      </div>

                    </div>


                    {/* REJECTED */}

                    <div className="admin-verification-box">

                      <div className="admin-verification-top">

                        <div>

                          <div className="admin-verification-label">
                            Rejected
                          </div>

                          <div className="admin-verification-value">
                            {formatNumber(
                              rejectedProperties
                            )}
                          </div>

                        </div>

                        <div className="admin-verification-icon">
                          ×
                        </div>

                      </div>

                      <div className="admin-progress">

                        <div
                          className="admin-progress-fill rejected"
                          style={{
                            width: `${rejectedRate}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>


                  <div className="admin-verification-summary">

                    <div className="admin-summary-item">

                      <span>
                        Verification Rate
                      </span>

                      <strong>
                        {verificationRate}%
                      </strong>

                    </div>


                    <div className="admin-summary-item">

                      <span>
                        Records Requiring Action
                      </span>

                      <strong>
                        {formatNumber(
                          pendingProperties
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>


              {/* USER DISTRIBUTION */}

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>

                    <h2>
                      User Distribution
                    </h2>

                    <span>
                      Registered system users
                    </span>

                  </div>

                </div>


                <div className="admin-panel-body">

                  <div className="admin-user-chart">

                    <div className="admin-user-chart-inner">

                      <strong>
                        {formatNumber(totalUsers)}
                      </strong>

                      <span>
                        USERS
                      </span>

                    </div>

                  </div>


                  <div className="admin-user-list">

                    <div className="admin-user-row">

                      <div className="admin-user-label">

                        <span className="admin-user-dot green"></span>

                        Sellers

                      </div>

                      <strong>
                        {formatNumber(sellers)}
                      </strong>

                    </div>


                    <div className="admin-user-row">

                      <div className="admin-user-label">

                        <span className="admin-user-dot blue"></span>

                        Buyers

                      </div>

                      <strong>
                        {formatNumber(buyers)}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =====================================================
                QUICK ACTIONS
            ===================================================== */}

            <div className="admin-panel">

              <div className="admin-panel-header">

                <div>

                  <h2>
                    Quick Actions
                  </h2>

                  <span>
                    Administrator tools
                  </span>

                </div>

              </div>


              <div className="admin-panel-body">

                <div className="admin-quick-grid">


                  <NavLink
                    to="/admin/seller-verification"
                    className="admin-quick-card"
                  >

                    <div className="admin-quick-icon green">
                      ♙
                    </div>

                    <div className="admin-quick-content">

                      <strong>
                        Verify Sellers
                      </strong>

                      <span>
                        Review and approve seller
                        accounts.
                      </span>

                    </div>

                    <b className="admin-quick-arrow">
                      →
                    </b>

                  </NavLink>


                  <NavLink
                    to="/admin/buyer-verification"
                    className="admin-quick-card"
                  >

                    <div className="admin-quick-icon blue">
                      ♙
                    </div>

                    <div className="admin-quick-content">

                      <strong>
                        Verify Buyers
                      </strong>

                      <span>
                        Review buyer verification
                        requests.
                      </span>

                    </div>

                    <b className="admin-quick-arrow">
                      →
                    </b>

                  </NavLink>


                  <NavLink
                    to="/admin/land-verification"
                    className="admin-quick-card"
                  >

                    <div className="admin-quick-icon yellow">
                      ◇
                    </div>

                    <div className="admin-quick-content">

                      <strong>
                        Verify Lands
                      </strong>

                      <span>
                        Check land details and
                        official documents.
                      </span>

                    </div>

                    <b className="admin-quick-arrow">
                      →
                    </b>

                  </NavLink>


                  <NavLink
                    to="/admin/blockchain"
                    className="admin-quick-card"
                  >

                    <div className="admin-quick-icon purple">
                      ⬡
                    </div>

                    <div className="admin-quick-content">

                      <strong>
                        Blockchain Records
                      </strong>

                      <span>
                        Monitor blockchain ownership
                        records.
                      </span>

                    </div>

                    <b className="admin-quick-arrow">
                      →
                    </b>

                  </NavLink>

                </div>

              </div>

            </div>


            {/* =====================================================
                LOWER SECTION
            ===================================================== */}

            <div
              className="admin-dashboard-grid"
              style={{ marginTop: "20px" }}
            >


              {/* LAND STATUS */}

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>

                    <h2>
                      Land Registry Status
                    </h2>

                    <span>
                      Current records
                    </span>

                  </div>

                </div>


                <div className="admin-panel-body">

                  <div className="admin-land-status">


                    <div className="admin-land-status-row">

                      <div className="admin-land-status-left">

                        <div className="admin-land-status-icon pending">
                          ◷
                        </div>

                        <div className="admin-land-status-text">

                          <strong>
                            Pending Verification
                          </strong>

                          <small>
                            Requires administrator review
                          </small>

                        </div>

                      </div>

                      <strong>
                        {formatNumber(
                          pendingProperties
                        )}
                      </strong>

                    </div>


                    <div className="admin-land-status-row">

                      <div className="admin-land-status-left">

                        <div className="admin-land-status-icon verified">
                          ✓
                        </div>

                        <div className="admin-land-status-text">

                          <strong>
                            Verified Records
                          </strong>

                          <small>
                            Approved land records
                          </small>

                        </div>

                      </div>

                      <strong>
                        {formatNumber(
                          verifiedProperties
                        )}
                      </strong>

                    </div>


                    <div className="admin-land-status-row">

                      <div className="admin-land-status-left">

                        <div className="admin-land-status-icon rejected">
                          ×
                        </div>

                        <div className="admin-land-status-text">

                          <strong>
                            Rejected Records
                          </strong>

                          <small>
                            Records requiring correction
                          </small>

                        </div>

                      </div>

                      <strong>
                        {formatNumber(
                          rejectedProperties
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>


              {/* WORKFLOW */}

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>

                    <h2>
                      Verification Workflow
                    </h2>

                    <span>
                      Land approval process
                    </span>

                  </div>

                </div>


                <div className="admin-panel-body">

                  <div className="admin-workflow">


                    <div className="admin-workflow-step">

                      <div className="admin-workflow-number">
                        1
                      </div>

                      <div className="admin-workflow-text">

                        <strong>
                          Seller submits land
                        </strong>

                        <span>
                          Land details and supporting
                          documents are submitted.
                        </span>

                      </div>

                    </div>


                    <div className="admin-workflow-line"></div>


                    <div className="admin-workflow-step">

                      <div className="admin-workflow-number">
                        2
                      </div>

                      <div className="admin-workflow-text">

                        <strong>
                          Admin reviews records
                        </strong>

                        <span>
                          Check submitted information
                          against official records.
                        </span>

                      </div>

                    </div>


                    <div className="admin-workflow-line"></div>


                    <div className="admin-workflow-step">

                      <div className="admin-workflow-number">
                        3
                      </div>

                      <div className="admin-workflow-text">

                        <strong>
                          Approve or reject
                        </strong>

                        <span>
                          Only verified land proceeds
                          to the next stage.
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =====================================================
                TRANSACTION SUMMARY
            ===================================================== */}

            <div
              className="admin-panel"
              style={{ marginTop: "20px" }}
            >

              <div className="admin-panel-header">

                <div>

                  <h2>
                    System Activity
                  </h2>

                  <span>
                    Registry overview
                  </span>

                </div>

              </div>


              <div className="admin-panel-body">

                <div className="admin-activity-grid">

                  <div className="admin-activity-card">

                    <div className="admin-activity-icon blue">
                      ▣
                    </div>

                    <div>

                      <span>
                        Total Transactions
                      </span>

                      <strong>
                        {formatNumber(
                          totalTransactions
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="admin-activity-card">

                    <div className="admin-activity-icon green">
                      ✓
                    </div>

                    <div>

                      <span>
                        Verified Lands
                      </span>

                      <strong>
                        {formatNumber(
                          verifiedProperties
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="admin-activity-card">

                    <div className="admin-activity-icon yellow">
                      !
                    </div>

                    <div>

                      <span>
                        Pending Lands
                      </span>

                      <strong>
                        {formatNumber(
                          pendingProperties
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="admin-activity-card">

                    <div className="admin-activity-icon purple">
                      ⬡
                    </div>

                    <div>

                      <span>
                        Blockchain Status
                      </span>

                      <strong>
                        Ready
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
};

export default AdminDashboard;