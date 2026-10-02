import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function RegisterLand() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ======================================================
  // FORM
  // ======================================================

  const [form, setForm] = useState({
    owner_name: '',
    owner_mobile: '',
    owner_count: '1',
    sale_amount: '',

    land_id: '',

    district: '',
    taluk: '',
    village: '',

    survey_number: '',
    subdivision_number: '',

    area: '',
    area_unit: 'ACRES',

    land_type: 'Agricultural',
    usage_type: 'Agriculture',

    latitude: '',
    longitude: ''
  });

  const [document, setDocument] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setError('');
    setMessage('');
  };

  // ======================================================
  // PDF
  // ======================================================

  const handleDocumentChange = (e) => {
    const file =
      e.target.files?.[0];

    setError('');
    setMessage('');

    if (!file) {
      setDocument(null);
      return;
    }

    // PDF ONLY
    if (
      file.type !== 'application/pdf' &&
      !file.name
        .toLowerCase()
        .endsWith('.pdf')
    ) {
      setError(
        'Only PDF documents are allowed.'
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setDocument(null);
      return;
    }

    // 10 MB
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        'PDF must be smaller than 10 MB.'
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setDocument(null);
      return;
    }

    setDocument(file);
  };

  // ======================================================
  // RESET
  // ======================================================

  const resetForm = () => {
    setForm({
      owner_name: '',
      owner_mobile: '',
      owner_count: '1',
      sale_amount: '',

      land_id: '',

      district: '',
      taluk: '',
      village: '',

      survey_number: '',
      subdivision_number: '',

      area: '',
      area_unit: 'ACRES',

      land_type: 'Agricultural',
      usage_type: 'Agriculture',

      latitude: '',
      longitude: ''
    });

    setDocument(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // ==================================================
      // TOKEN
      // ==================================================

      const token =
        localStorage.getItem(
          'sellerToken'
        );

      if (!token) {
        throw new Error(
          'Please login as seller first.'
        );
      }

      // ==================================================
      // SELLER
      // ==================================================

      const sellerUser =
        localStorage.getItem(
          'sellerUser'
        );

      if (!sellerUser) {
        throw new Error(
          'Seller session not found. Please login again.'
        );
      }

      // ==================================================
      // WALLET
      // ==================================================

      const wallet =
        localStorage.getItem(
          'sellerWallet'
        );

      if (!wallet) {
        throw new Error(
          'Please connect MetaMask before registering land.'
        );
      }

      // ==================================================
      // DOCUMENT
      // ==================================================

      if (!document) {
        throw new Error(
          'Please upload the land ownership PDF.'
        );
      }

      // ==================================================
      // OWNER COUNT
      // ==================================================

      const ownerCount =
        Number(form.owner_count);

      if (
        !Number.isInteger(
          ownerCount
        ) ||
        ownerCount < 1
      ) {
        throw new Error(
          'Number of owners must be at least 1.'
        );
      }

      // ==================================================
      // SALE AMOUNT
      // ==================================================

      if (
        form.sale_amount !== '' &&
        Number(form.sale_amount) < 0
      ) {
        throw new Error(
          'Sale amount cannot be negative.'
        );
      }

      // ==================================================
      // MOBILE
      // ==================================================

      if (
        !/^[6-9][0-9]{9}$/.test(
          form.owner_mobile.trim()
        )
      ) {
        throw new Error(
          'Enter a valid 10-digit Indian mobile number.'
        );
      }

      // ==================================================
      // FORM DATA
      // ==================================================

      const formData =
        new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          formData.append(
            key,
            value
          );
        }
      );

      formData.append(
        'land_document',
        document
      );

      formData.append(
        'wallet_address',
        wallet
      );

      // ==================================================
      // REQUEST
      // ==================================================

      const response =
        await fetch(
          `${API_URL}/lands/register`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`
            },

            body: formData
          }
        );

      const contentType =
        response.headers.get(
          'content-type'
        ) || '';

      let data;

      if (
        contentType.includes(
          'application/json'
        )
      ) {
        data =
          await response.json();
      } else {
        const text =
          await response.text();

        console.error(
          'Backend returned:',
          text
        );

        throw new Error(
          'Backend returned an invalid response.'
        );
      }

      // ==================================================
      // ERROR
      // ==================================================

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
          'Land registration failed.'
        );
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      setMessage(
        data.message ||
        'Land registered successfully. Waiting for admin verification.'
      );

      resetForm();

    } catch (err) {
      console.error(
        'Register land error:',
        err
      );

      setError(
        err.message ||
        'Something went wrong while registering the land.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // BACK
  // ======================================================

  const handleBackToDashboard =
    () => {
      navigate(
        '/seller/dashboard'
      );
    };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div style={styles.header}>

          <button
            type="button"
            onClick={
              handleBackToDashboard
            }
            style={
              styles.backButton
            }
          >
            ← Back to Seller Dashboard
          </button>

          <div
            style={styles.label}
          >
            SELLER / LAND REGISTRATION
          </div>

          <h1
            style={styles.title}
          >
            Register Your Land
          </h1>

          <p
            style={styles.subtitle}
          >
            Submit complete land ownership
            details for administrator
            verification.
          </p>

        </div>

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {message && (
          <div
            style={
              styles.success
            }
          >
            ✓ {message}
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            style={
              styles.error
            }
          >
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >

          {/* ==================================================
              OWNER INFORMATION
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={
                styles.cardTitle
              }
            >
              Owner Information
            </h2>

            <div
              style={styles.grid}
            >

              <Field
                label="Primary Owner Name"
                name="owner_name"
                value={
                  form.owner_name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter owner name"
                required
              />

              <Field
                label="Primary Owner Mobile"
                name="owner_mobile"
                value={
                  form.owner_mobile
                }
                onChange={
                  handleChange
                }
                placeholder="10-digit mobile number"
                required
              />

              <Field
                label="Number of Owners"
                name="owner_count"
                type="number"
                value={
                  form.owner_count
                }
                onChange={
                  handleChange
                }
                placeholder="Example: 2"
                min="1"
                step="1"
                required
              />

              <Field
                label="Expected Sale Amount (₹)"
                name="sale_amount"
                type="number"
                value={
                  form.sale_amount
                }
                onChange={
                  handleChange
                }
                placeholder="Example: 2500000"
                min="0"
                step="0.01"
              />

            </div>

            {/* OWNER NOTE */}

            <div
              style={
                styles.infoBox
              }
            >
              <strong>
                Ownership information
              </strong>

              <p
                style={
                  styles.infoText
                }
              >
                Enter the primary owner's
                details and the total number
                of legal owners mentioned in
                the ownership document.
              </p>

              <p
                style={
                  styles.infoText
                }
              >
                Example: If a property is
                jointly owned by 3 people,
                enter <strong>3</strong>.
              </p>

            </div>

          </div>

          {/* ==================================================
              LAND IDENTIFICATION
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={
                styles.cardTitle
              }
            >
              Land Identification
            </h2>

            <div
              style={styles.grid}
            >

              <Field
                label="Land ID"
                name="land_id"
                value={
                  form.land_id
                }
                onChange={
                  handleChange
                }
                placeholder="TN-LAND-001"
                required
              />

              <Field
                label="Survey Number"
                name="survey_number"
                value={
                  form.survey_number
                }
                onChange={
                  handleChange
                }
                placeholder="101/1"
                required
              />

              <Field
                label="Subdivision Number"
                name="subdivision_number"
                value={
                  form.subdivision_number
                }
                onChange={
                  handleChange
                }
                placeholder="Optional"
              />

              <Field
                label="Area"
                name="area"
                type="number"
                step="0.01"
                min="0"
                value={
                  form.area
                }
                onChange={
                  handleChange
                }
                placeholder="Enter area"
                required
              />

            </div>

          </div>

          {/* ==================================================
              LOCATION
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={
                styles.cardTitle
              }
            >
              Land Location
            </h2>

            <div
              style={styles.grid}
            >

              <Field
                label="District"
                name="district"
                value={
                  form.district
                }
                onChange={
                  handleChange
                }
                placeholder="Chennai"
                required
              />

              <Field
                label="Taluk"
                name="taluk"
                value={
                  form.taluk
                }
                onChange={
                  handleChange
                }
                placeholder="Taluk"
                required
              />

              <Field
                label="Village"
                name="village"
                value={
                  form.village
                }
                onChange={
                  handleChange
                }
                placeholder="Village"
                required
              />

              <Field
                label="Latitude"
                name="latitude"
                value={
                  form.latitude
                }
                onChange={
                  handleChange
                }
                placeholder="Optional"
              />

              <Field
                label="Longitude"
                name="longitude"
                value={
                  form.longitude
                }
                onChange={
                  handleChange
                }
                placeholder="Optional"
              />

            </div>

          </div>

          {/* ==================================================
              CLASSIFICATION
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={
                styles.cardTitle
              }
            >
              Land Classification
            </h2>

            <div
              style={styles.grid}
            >

              <SelectField
                label="Area Unit"
                name="area_unit"
                value={
                  form.area_unit
                }
                onChange={
                  handleChange
                }
                options={[
                  [
                    'ACRES',
                    'Acres'
                  ],
                  [
                    'HECTARES',
                    'Hectares'
                  ],
                  [
                    'SQ_FT',
                    'Square Feet'
                  ]
                ]}
              />

              <SelectField
                label="Land Type"
                name="land_type"
                value={
                  form.land_type
                }
                onChange={
                  handleChange
                }
                options={[
                  [
                    'Agricultural',
                    'Agricultural'
                  ],
                  [
                    'Residential',
                    'Residential'
                  ],
                  [
                    'Commercial',
                    'Commercial'
                  ],
                  [
                    'Industrial',
                    'Industrial'
                  ]
                ]}
              />

              <SelectField
                label="Usage Type"
                name="usage_type"
                value={
                  form.usage_type
                }
                onChange={
                  handleChange
                }
                options={[
                  [
                    'Agriculture',
                    'Agriculture'
                  ],
                  [
                    'Residential',
                    'Residential'
                  ],
                  [
                    'Commercial',
                    'Commercial'
                  ],
                  [
                    'Industrial',
                    'Industrial'
                  ]
                ]}
              />

            </div>

          </div>

          {/* ==================================================
              DOCUMENT
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={
                styles.cardTitle
              }
            >
              Land Ownership Document
            </h2>

            <p
              style={
                styles.documentInfo
              }
            >
              Upload the supporting
              ownership document in PDF
              format. Maximum size:
              10 MB.
            </p>

            <input
              ref={
                fileInputRef
              }
              id="land-document"
              type="file"
              accept="application/pdf,.pdf"
              onChange={
                handleDocumentChange
              }
              style={
                styles.fileInput
              }
              disabled={
                loading
              }
            />

            {document && (
              <div
                style={
                  styles.fileInfo
                }
              >

                <strong>
                  Selected document:
                </strong>

                <span>
                  {document.name}
                </span>

              </div>
            )}

          </div>

          {/* ==================================================
              BLOCKCHAIN
          ================================================== */}

          <div
            style={
              styles.walletBox
            }
          >

            <div
              style={
                styles.walletTitle
              }
            >
              🔗 Blockchain Wallet
            </div>

            <div
              style={
                styles.walletAddress
              }
            >
              {
                localStorage.getItem(
                  'sellerWallet'
                ) ||
                'Not connected'
              }
            </div>

            <div
              style={
                styles.walletNote
              }
            >
              This MetaMask wallet
              identifies the seller
              associated with this land
              record.
            </div>

          </div>

          {/* ==================================================
              VERIFICATION FLOW
          ================================================== */}

          <div
            style={
              styles.flowBox
            }
          >

            <div
              style={
                styles.flowTitle
              }
            >
              How this registration works
            </div>

            <div
              style={
                styles.flowSteps
              }
            >

              <span>
                1. Seller submits land
              </span>

              <span>
                →
              </span>

              <span>
                2. Admin verifies
              </span>

              <span>
                →
              </span>

              <span>
                3. Land becomes verified
              </span>

              <span>
                →
              </span>

              <span>
                4. Blockchain registration
              </span>

            </div>

          </div>

          {/* ==================================================
              BUTTONS
          ================================================== */}

          <div
            style={
              styles.buttonRow
            }
          >

            <button
              type="button"
              onClick={
                handleBackToDashboard
              }
              style={
                styles.cancelButton
              }
              disabled={
                loading
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              style={{
                ...styles.submitButton,
                opacity:
                  loading
                    ? 0.6
                    : 1
              }}
            >
              {loading
                ? 'Registering Land...'
                : 'Register Land'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


// ======================================================
// FIELD COMPONENT
// ======================================================

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  step,
  min
}) {
  return (
    <div>

      <label
        style={
          styles.fieldLabel
        }
      >
        {label}

        {required && (
          <span
            style={
              styles.required
            }
          >
            *
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        style={
          styles.input
        }
      />

    </div>
  );
}


// ======================================================
// SELECT COMPONENT
// ======================================================

function SelectField({
  label,
  name,
  value,
  onChange,
  options
}) {
  return (
    <div>

      <label
        style={
          styles.fieldLabel
        }
      >
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        style={
          styles.input
        }
      >

        {options.map(
          ([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          )
        )}

      </select>

    </div>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles = {

  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '32px',
    boxSizing: 'border-box',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
  },

  container: {
    maxWidth: '1050px',
    margin: '0 auto'
  },

  header: {
    marginBottom: '25px'
  },

  backButton: {
    border: 'none',
    background: 'transparent',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '22px'
  },

  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: '1px',
    marginBottom: '7px'
  },

  title: {
    margin: 0,
    fontSize: '30px',
    color: '#111827'
  },

  subtitle: {
    marginTop: '7px',
    color: '#64748b',
    fontSize: '14px'
  },

  card: {
    background: '#ffffff',
    border:
      '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '18px',
    boxShadow:
      '0 2px 5px rgba(15,23,42,0.03)'
  },

  cardTitle: {
    margin:
      '0 0 20px',
    fontSize: '18px',
    color: '#172033'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, minmax(0, 1fr))',
    gap: '18px'
  },

  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '7px'
  },

  required: {
    color: '#dc2626',
    marginLeft: '3px'
  },

  input: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    border:
      '1px solid #dbe2ea',
    borderRadius: '7px',
    padding: '0 12px',
    fontSize: '13px',
    outline: 'none',
    color: '#334155',
    background: '#ffffff'
  },

  infoBox: {
    marginTop: '20px',
    padding: '14px 16px',
    background: '#f8fafc',
    border:
      '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#475569',
    fontSize: '12px'
  },

  infoText: {
    margin:
      '6px 0 0',
    lineHeight: 1.5
  },

  documentInfo: {
    color: '#64748b',
    fontSize: '13px',
    marginBottom: '15px'
  },

  fileInput: {
    width: '100%',
    padding: '12px',
    border:
      '1px dashed #93c5fd',
    borderRadius: '8px',
    background: '#f8fbff',
    boxSizing: 'border-box'
  },

  fileInfo: {
    marginTop: '12px',
    display: 'flex',
    gap: '10px',
    fontSize: '13px',
    color: '#334155',
    flexWrap: 'wrap'
  },

  walletBox: {
    background: '#eff6ff',
    border:
      '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '18px',
    fontSize: '13px',
    color: '#1e3a8a'
  },

  walletTitle: {
    fontWeight: '700',
    marginBottom: '7px'
  },

  walletAddress: {
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    fontSize: '12px'
  },

  walletNote: {
    marginTop: '7px',
    fontSize: '11px',
    color: '#64748b'
  },

  flowBox: {
    background: '#f8fafc',
    border:
      '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '17px',
    marginBottom: '18px'
  },

  flowTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '12px'
  },

  flowSteps: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '11px'
  },

  success: {
    padding:
      '13px 16px',
    marginBottom: '18px',
    borderRadius: '8px',
    background: '#ecfdf5',
    border:
      '1px solid #a7f3d0',
    color: '#047857',
    fontSize: '13px'
  },

  error: {
    padding:
      '13px 16px',
    marginBottom: '18px',
    borderRadius: '8px',
    background: '#fef2f2',
    border:
      '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: '13px'
  },

  buttonRow: {
    display: 'grid',
    gridTemplateColumns:
      '180px 1fr',
    gap: '12px',
    marginBottom: '30px'
  },

  cancelButton: {
    height: '48px',
    border:
      '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#334155',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  submitButton: {
    height: '48px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer'
  }

};

export default RegisterLand;