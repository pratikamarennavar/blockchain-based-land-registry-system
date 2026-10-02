import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

function BrowseProperties() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [usageFilter, setUsageFilter] = useState("ALL");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [search, usageFilter, properties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("buyerToken");

      if (!token) {
        navigate("/buyer/login");
        return;
      }

      /*
       * This endpoint will return verified lands available
       * for purchase.
       *
       * We will create/connect this backend endpoint next.
       */

      const response = await fetch(
        `${API_BASE_URL}/buyer/properties`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load properties"
        );
      }

      if (data.success) {
        const list = data.properties || [];

        setProperties(list);
        setFilteredProperties(list);
      } else {
        throw new Error(
          data.message || "Unable to load properties"
        );
      }
    } catch (err) {
      console.error("Browse properties error:", err);

      /*
       * We don't show fake properties.
       * The page clearly tells the user when backend
       * data is not available.
       */
      setError(err.message || "Unable to load properties");
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let result = [...properties];

    if (search.trim()) {
      const searchText = search.toLowerCase();

      result = result.filter((property) => {
        return (
          String(property.land_id || "")
            .toLowerCase()
            .includes(searchText) ||
          String(property.location || "")
            .toLowerCase()
            .includes(searchText) ||
          String(property.survey_number || "")
            .toLowerCase()
            .includes(searchText) ||
          String(property.district || "")
            .toLowerCase()
            .includes(searchText) ||
          String(property.village || "")
            .toLowerCase()
            .includes(searchText)
        );
      });
    }

    if (usageFilter !== "ALL") {
      result = result.filter(
        (property) =>
          String(
            property.usage_type ||
              property.usage ||
              ""
          ).toUpperCase() === usageFilter
      );
    }

    setFilteredProperties(result);
  };

  const getUsage = (property) => {
    return (
      property.usage_type ||
      property.usage ||
      "Not specified"
    );
  };

  const getArea = (property) => {
    const area =
      property.area ??
      property.land_area ??
      0;

    const unit =
      property.area_unit ||
      property.land_unit ||
      "";

    if (!area) {
      return "Not specified";
    }

    return `${area} ${unit}`.trim();
  };

  const getAmount = (property) => {
    const amount =
      property.sale_amount ??
      property.expected_sale_amount ??
      property.land_amount;

    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "Price not specified";
    }

    const number = Number(amount);

    if (Number.isNaN(number)) {
      return amount;
    }

    return `₹${number.toLocaleString("en-IN")}`;
  };

  const getOwnerName = (property) => {
    if (property.current_owner_name) {
      return property.current_owner_name;
    }

    if (property.primary_owner_name) {
      return property.primary_owner_name;
    }

    if (property.seller_name) {
      return property.seller_name;
    }

    if (property.owner_name) {
      return property.owner_name;
    }

    /*
     * owner_names may be returned as JSON
     */
    if (property.owner_names) {
      try {
        const owners =
          typeof property.owner_names === "string"
            ? JSON.parse(property.owner_names)
            : property.owner_names;

        if (Array.isArray(owners)) {
          return owners.join(", ");
        }

        if (typeof owners === "object") {
          return Object.values(owners).join(", ");
        }
      } catch (error) {
        return property.owner_names;
      }
    }

    return "Owner information unavailable";
  };

  const getLocation = (property) => {
    if (property.location) {
      return property.location;
    }

    const parts = [
      property.village,
      property.taluk,
      property.district,
      property.state,
    ].filter(Boolean);

    return parts.length
      ? parts.join(", ")
      : "Location not specified";
  };

  const getLandId = (property) => {
    return (
      property.land_id ||
      property.id ||
      "N/A"
    );
  };

  const handleViewDetails = (property) => {
    const landId =
      property.id ||
      property.land_id;

    if (!landId) {
      return;
    }

    navigate(`/buyer/properties/${landId}`);
  };

  return (
    <div className="buyer-properties-page">
      {/* ================= HEADER ================= */}

      <div className="properties-header">
        <div>
          <h1>Browse Properties</h1>

          <p>
            Explore verified properties available
            for purchase.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchProperties}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ================= SEARCH / FILTER ================= */}

      <div className="property-toolbar">
        <div className="search-box">
          <span>🔎</span>

          <input
            type="text"
            placeholder="Search by land ID, location or survey number..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={usageFilter}
          onChange={(e) =>
            setUsageFilter(e.target.value)
          }
        >
          <option value="ALL">
            All Property Types
          </option>

          <option value="AGRICULTURAL">
            Agricultural
          </option>

          <option value="RESIDENTIAL">
            Residential
          </option>

          <option value="COMMERCIAL">
            Commercial
          </option>

          <option value="INDUSTRIAL">
            Industrial
          </option>
        </select>
      </div>

      {/* ================= RESULT COUNT ================= */}

      <div className="result-information">
        <span>
          {filteredProperties.length}{" "}
          {filteredProperties.length === 1
            ? "property"
            : "properties"}{" "}
          available
        </span>

        {search && (
          <span className="search-result-text">
            Search results for "{search}"
          </span>
        )}
      </div>

      {/* ================= LOADING ================= */}

      {loading && (
        <div className="state-box">
          <div className="loading-spinner"></div>

          <h3>Loading properties...</h3>

          <p>
            Fetching verified properties from the
            Land Registry.
          </p>
        </div>
      )}

      {/* ================= ERROR ================= */}

      {!loading && error && (
        <div className="state-box error-state">
          <div className="state-icon">⚠️</div>

          <h3>Unable to load properties</h3>

          <p>{error}</p>

          <button
            className="retry-btn"
            onClick={fetchProperties}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ================= EMPTY ================= */}

      {!loading &&
        !error &&
        filteredProperties.length === 0 && (
          <div className="state-box">
            <div className="state-icon">🏡</div>

            <h3>
              {properties.length === 0
                ? "No properties available"
                : "No matching properties"}
            </h3>

            <p>
              {properties.length === 0
                ? "There are currently no verified properties available for purchase."
                : "Try changing your search or property type filter."}
            </p>

            {search && (
              <button
                className="retry-btn"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            )}
          </div>
        )}

      {/* ================= PROPERTY GRID ================= */}

      {!loading &&
        !error &&
        filteredProperties.length > 0 && (
          <div className="property-grid">
            {filteredProperties.map(
              (property, index) => (
                <PropertyCard
                  key={
                    property.id ||
                    property.land_id ||
                    index
                  }
                  property={property}
                  getUsage={getUsage}
                  getArea={getArea}
                  getAmount={getAmount}
                  getOwnerName={getOwnerName}
                  getLocation={getLocation}
                  getLandId={getLandId}
                  onViewDetails={
                    handleViewDetails
                  }
                />
              )
            )}
          </div>
        )}
    </div>
  );
}

/* =====================================================
   PROPERTY CARD
===================================================== */

function PropertyCard({
  property,
  getUsage,
  getArea,
  getAmount,
  getOwnerName,
  getLocation,
  getLandId,
  onViewDetails,
}) {
  return (
    <div className="property-card">
      {/* Card top */}

      <div className="property-card-top">
        <div className="land-icon">
          🏡
        </div>

        <span className="verified-badge">
          ✓ Verified
        </span>
      </div>

      {/* Land ID */}

      <div className="land-id-label">
        LAND ID
      </div>

      <h2 className="property-land-id">
        {getLandId(property)}
      </h2>

      {/* Location */}

      <div className="property-location">
        <span>📍</span>

        <span>
          {getLocation(property)}
        </span>
      </div>

      {/* Details */}

      <div className="property-details">
        <div className="detail-row">
          <span>Survey Number</span>

          <strong>
            {property.survey_number ||
              property.surveyNumber ||
              "N/A"}
          </strong>
        </div>

        <div className="detail-row">
          <span>Area</span>

          <strong>
            {getArea(property)}
          </strong>
        </div>

        <div className="detail-row">
          <span>Property Type</span>

          <strong>
            {getUsage(property)}
          </strong>
        </div>

        <div className="detail-row">
          <span>Owner</span>

          <strong>
            {getOwnerName(property)}
          </strong>
        </div>
      </div>

      {/* Price */}

      <div className="property-price">
        <span>Expected Sale Amount</span>

        <strong>
          {getAmount(property)}
        </strong>
      </div>

      {/* Action */}

      <button
        className="view-property-btn"
        onClick={() =>
          onViewDetails(property)
        }
      >
        View Property Details
        <span>→</span>
      </button>
    </div>
  );
}

export default BrowseProperties;

/* =====================================================
   STYLES
===================================================== */

const style = document.createElement("style");

style.innerHTML = `
.buyer-properties-page {
  min-height: 100vh;
  background: #f5f8f6;
  padding: 28px;
  box-sizing: border-box;
}

.properties-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.properties-header h1 {
  margin: 0;
  color: #172b1f;
  font-size: 28px;
  font-weight: 700;
}

.properties-header p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
}

.refresh-btn {
  border: 1px solid #d5e1d9;
  background: #ffffff;
  color: #166534;
  padding: 10px 16px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.refresh-btn:hover {
  background: #f0fdf4;
}

.property-toolbar {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
  background: #ffffff;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e5ebe7;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #dce5df;
  border-radius: 9px;
  padding: 0 13px;
  background: #ffffff;
}

.search-box span {
  font-size: 16px;
}

.search-box input {
  width: 100%;
  height: 42px;
  border: none;
  outline: none;
  font-size: 13px;
  color: #334155;
}

.property-toolbar select {
  min-width: 190px;
  height: 44px;
  border: 1px solid #dce5df;
  border-radius: 9px;
  padding: 0 12px;
  color: #334155;
  background: #ffffff;
  outline: none;
}

.result-information {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  color: #64748b;
  font-size: 13px;
}

.search-result-text {
  color: #166534;
}

.property-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(285px, 1fr)
  );
  gap: 20px;
}

.property-card {
  background: #ffffff;
  border: 1px solid #e3ebe6;
  border-radius: 16px;
  padding: 20px;
  box-shadow:
    0 3px 10px rgba(15, 23, 42, 0.045);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.property-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.08);
}

.property-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.land-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
}

.verified-badge {
  background: #dcfce7;
  color: #166534;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.land-id-label {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.7px;
}

.property-land-id {
  margin: 5px 0 10px;
  color: #172b1f;
  font-size: 18px;
  font-weight: 700;
}

.property-location {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 18px;
  min-height: 36px;
}

.property-details {
  border-top: 1px solid #edf1ee;
  border-bottom: 1px solid #edf1ee;
  padding: 12px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row span {
  color: #64748b;
  font-size: 11px;
}

.detail-row strong {
  color: #334155;
  font-size: 11px;
  text-align: right;
  max-width: 55%;
  overflow-wrap: anywhere;
}

.property-price {
  padding: 15px 0;
}

.property-price span {
  display: block;
  color: #64748b;
  font-size: 11px;
  margin-bottom: 5px;
}

.property-price strong {
  color: #166534;
  font-size: 20px;
}

.view-property-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 9px;
  background: linear-gradient(
    135deg,
    #15803d,
    #166534
  );
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
}

.view-property-btn:hover {
  opacity: 0.92;
}

.state-box {
  background: #ffffff;
  border: 1px solid #e3ebe6;
  border-radius: 16px;
  padding: 55px 25px;
  text-align: center;
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.04);
}

.state-box h3 {
  margin: 12px 0 6px;
  color: #334155;
  font-size: 16px;
}

.state-box p {
  margin: 0 auto 18px;
  max-width: 500px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.state-icon {
  font-size: 40px;
}

.error-state {
  border-color: #fecaca;
}

.loading-spinner {
  width: 34px;
  height: 34px;
  margin: 0 auto;
  border: 3px solid #dcfce7;
  border-top-color: #15803d;
  border-radius: 50%;
  animation: buyerSpin 0.8s linear infinite;
}

@keyframes buyerSpin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  border: none;
  background: #15803d;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

@media (max-width: 700px) {
  .buyer-properties-page {
    padding: 18px;
  }

  .property-toolbar {
    flex-direction: column;
  }

  .property-toolbar select {
    width: 100%;
  }

  .result-information {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
}
`;

document.head.appendChild(style);