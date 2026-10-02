import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// ==========================================================
// HOME
// ==========================================================

import Home from "../pages/Home";

// ==========================================================
// MAIN AUTH
// ==========================================================

import Login from "../pages/auth/Login";

// ==========================================================
// COMMON
// ==========================================================

import ProtectedRoute from "../components/common/ProtectedRoute";

// ==========================================================
// ADMIN
// ==========================================================

import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AllUsers from "../pages/admin/AllUsers";
import AllProperties from "../pages/admin/AllProperties";
import SellerVerification from "../pages/admin/SellerVerification";
import BuyerVerification from "../pages/admin/BuyerVerification";
import LandVerification from "../pages/admin/LandVerification";
import BuyerRequests from "../pages/admin/BuyerRequests";
import AdminWallet from "../pages/admin/AdminWallet";

import Transactions from "../pages/admin/Transactions";
import BlockchainRecords from "../pages/admin/BlockchainRecords";
import Analytics from "../pages/admin/Analytics";
import Notifications from "../pages/admin/Notifications";
import Settings from "../pages/admin/Settings";

// ==========================================================
// SELLER
// ==========================================================

import SellerRegister from "../pages/seller/SellerRegister";
import SellerLogin from "../pages/seller/SellerLogin";
import SellerModule from "../pages/seller/SellerModule";
import RegisterLand from "../pages/seller/RegisterLand";

// ==========================================================
// BUYER
// ==========================================================

import BuyerLayout from "../layouts/BuyerLayout";

import BuyerProfile from "../pages/buyer/BuyerProfile";
import BuyerNotifications from "../pages/buyer/BuyerNotifications";
import BuyerSettings from "../pages/buyer/BuyerSettings";
import BuyerRegister from "../pages/buyer/BuyerRegister";
import BuyerLogin from "../pages/buyer/BuyerLogin";
import BuyerDashboard from "../pages/buyer/BuyerDashboard";
import BrowseProperties from "../pages/buyer/BrowseProperties";
import PropertyDetails from "../pages/buyer/PropertyDetails";
import PurchaseRequest from "../pages/buyer/PurchaseRequest";
import MyRequests from "../pages/buyer/MyRequests";
import MyProperties from "../pages/buyer/MyProperties";
import BuyerWallet from "../pages/buyer/BuyerWallet";

// ==========================================================
// APP ROUTES
// ==========================================================

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            HOME
        ================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ==================================================
            MAIN LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ==================================================
            SELLER AUTH
        ================================================== */}

        <Route
          path="/seller/register"
          element={<SellerRegister />}
        />

        <Route
          path="/seller/login"
          element={<SellerLogin />}
        />

        {/* ==================================================
            SELLER MODULE
        ================================================== */}

        <Route
          path="/seller/dashboard"
          element={<SellerModule />}
        />

        <Route
          path="/seller/register-land"
          element={<RegisterLand />}
        />

        {/* ==================================================
            ADMIN MODULE
        ================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          {/* /admin → /admin/dashboard */}
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          {/* Users */}
          <Route
            path="users"
            element={<AllUsers />}
          />

          {/* Properties */}
          <Route
            path="properties"
            element={<AllProperties />}
          />

          {/* Seller Verification */}
          <Route
            path="seller-verification"
            element={<SellerVerification />}
          />

          {/* Buyer Verification */}
          <Route
            path="buyer-verification"
            element={<BuyerVerification />}
          />

          {/* Land Verification */}
          <Route
            path="land-verification"
            element={<LandVerification />}
          />

          {/* Buyer Requests */}
          <Route
            path="buyer-requests"
            element={<BuyerRequests />}
          />

          {/* Transactions */}
          <Route
            path="transactions"
            element={<Transactions />}
          />

          {/* ==================================================
              BLOCKCHAIN RECORDS

              Both URLs are supported because different parts
              of your existing Admin UI use different paths.
          ================================================== */}

          <Route
            path="blockchain"
            element={<BlockchainRecords />}
          />

          <Route
            path="blockchain-records"
            element={<BlockchainRecords />}
          />

          {/* Admin Wallet */}
          <Route
            path="wallet"
            element={<AdminWallet />}
          />

          {/* Analytics */}
          <Route
            path="analytics"
            element={<Analytics />}
          />

          {/* Notifications */}
          <Route
            path="notifications"
            element={<Notifications />}
          />

          {/* Settings */}
          <Route
            path="settings"
            element={<Settings />}
          />

        </Route>

        {/* ==================================================
            BUYER AUTH
        ================================================== */}

        <Route
          path="/buyer/register"
          element={<BuyerRegister />}
        />

        <Route
          path="/buyer/login"
          element={<BuyerLogin />}
        />

        {/* ==================================================
            BUYER MODULE
        ================================================== */}

        <Route
          path="/buyer"
          element={<BuyerLayout />}
        >

          {/* /buyer → /buyer/dashboard */}
          <Route
            index
            element={
              <Navigate
                to="/buyer/dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={<BuyerDashboard />}
          />

          {/* Browse Properties */}
          <Route
            path="properties"
            element={<BrowseProperties />}
          />

          {/* Property Details */}
          <Route
            path="properties/:landId"
            element={<PropertyDetails />}
          />

          {/* Purchase Request */}
          <Route
            path="properties/:landId/request"
            element={<PurchaseRequest />}
          />

          {/* My Requests */}
          <Route
            path="requests"
            element={<MyRequests />}
          />

          {/* My Properties */}
          <Route
            path="my-properties"
            element={<MyProperties />}
          />

          {/* Profile */}
          <Route
            path="profile"
            element={<BuyerProfile />}
          />

          {/* Notifications */}
          <Route
            path="notifications"
            element={<BuyerNotifications />}
          />

          {/* Settings */}
          <Route
            path="settings"
            element={<BuyerSettings />}
          />

          {/* Wallet */}
          <Route
            path="wallet"
            element={<BuyerWallet />}
          />

        </Route>

        {/* ==================================================
            UNKNOWN URL
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;