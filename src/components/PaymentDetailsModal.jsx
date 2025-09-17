import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

export const PaymentDetailsModal = ({
  onSubmit,
  addonData,
  // amount,
  ticketCount,
  selectedDate,
  startTime,
  endTime,
  selectedBundel,
  totalBaseAmount,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    repeatEmail: "",
    phone: "",
    postalCode: "",
    couponCode: "",
    administrationFee: 2.5,
    termsAccepted: [false],
  });

  const [voucherData, setVoucherData] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const timerRef = useRef();

  const BASE_URL = "https://api.megajumpparktickets.eu";
  const ADMIN_FEE = 2.5;

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/settings`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        });

        const eventData = Array.isArray(response.data) ? response.data[0] : response.data;
        setSetting(eventData);
      } catch (err) {
        console.error("❌ Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, [selectedBundel]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(timerRef.current);
        return 0;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log("formData",formData);
  };

  const handleCheckboxChange = (index) => {
    const updated = [...formData.termsAccepted];
    updated[index] = !updated[index];
    setFormData((prev) => ({ ...prev, termsAccepted: updated }));
   
  };

  const validateVoucher = async () => {
    if (!formData.couponCode.trim()) {
      setVoucherError("Please enter a coupon code");
      setVoucherData(null);
      return;
    }

    setVoucherLoading(true);
    setVoucherError("");

    try {
      const response = await axios.post(`${BASE_URL}/api/discount-vouchers/validate`, {
        code: formData.couponCode.toUpperCase(),
        amount: totalPrice
      }, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
      });

      if (response.data.success) {
        setVoucherData(response.data.data);
        setVoucherError("");
      } else {
        setVoucherError(response.data.message || "Invalid voucher");
        setVoucherData(null);
      }
    } catch (error) {
      console.error("Voucher validation error:", error);
      setVoucherError(error.response?.data?.message || "Failed to validate voucher");
      setVoucherData(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const clearVoucher = () => {
    setVoucherData(null);
    setVoucherError("");
    setFormData(prev => ({ ...prev, couponCode: "" }));
  };

  const handleSubmit = () => {
    const requiredFields = ["name", "email", "repeatEmail", "phone", "postalCode"];
    const emptyField = requiredFields.find((field) => !formData[field]?.trim());
    if (emptyField) {
      alert("Please fill all required fields before submitting the ticket.");
      return;
    }
    console.log("alert",formData);
    if (formData.email !== formData.repeatEmail) {
      alert("Emails do not match.");
      return;
    }

    if (timer === 0) {
      alert("The ticket you selected is no more reserved for you.");
      window.location.reload();
      return;
    }

    if (formData.termsAccepted.every((val) => val)) {
      const submitData = { 
        ...formData, 
        ...addonData, 
        addonData,
        paymentMethod: "card",
        voucherData: voucherData ? {
          code: voucherData.voucher.code,
          discountAmount: voucherData.discountAmount,
          originalAmount: voucherData.originalAmount,
          finalAmount: voucherData.finalAmount
        } : null,
        // Pass the voucher-adjusted total amount
        totalAmount: totalPrice
      };
      onSubmit(submitData);
      
    } else {
      alert("Please accept all terms to continue.");
    }
  };

  const ticketAmount = Number(totalBaseAmount || 0);
  const addonAmount = Number(addonData?.totalAddOnAmount || 0);
  const bundlePrice = Number(selectedBundel?.price || 0);
  const bundleDiscountPercent = Number(selectedBundel?.discountPercent || 0);
  const bundleDiscount = bundlePrice * (bundleDiscountPercent / 100);
  const discountedBundlePrice = bundlePrice - bundleDiscount;
  console.log(totalBaseAmount); 
  
  // Calculate base total before voucher discount
  const baseTotal = ticketAmount + addonAmount + discountedBundlePrice + ADMIN_FEE;
  
  // Apply voucher discount if available
  const voucherDiscount = voucherData ? voucherData.discountAmount : 0;
  const totalPrice = baseTotal - voucherDiscount;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

  if (loading) return <div className="modal-overlay">Loading settings...</div>;

  return (
    <div className="modal-overlay">
      <div className="pmodal-box">
        <h2>Mega Jump Ticket</h2>
        <p>{setting?.address || "Event Venue"}</p>
        <p>
          {formatDate(setting?.startDate)} - {formatDate(setting?.endDate)}
        </p>

        <div className="summary">
          <div className="summary-row">
            <p>
              <strong>Selected Date:</strong> {selectedDate}
            </p>
            <p>
              <strong>Time Slot:</strong> {startTime} - {endTime}
            </p>
          </div>
        </div>

        <div className="summary">
          <div className="summary-row">
            <p>{ticketCount} x Mega Jump individual Ticket</p>
            <p>€{ticketAmount.toFixed(2)}</p>
          </div>

          {selectedBundel && (
            <>
              <div className="summary-row">
                <p>Bundle: {selectedBundel.name} - Discount: {bundleDiscountPercent}%</p>
                <p>
                  €{bundlePrice.toFixed(2)} - €{bundleDiscount.toFixed(2)} = €{discountedBundlePrice.toFixed(2)}
                </p>
              </div>
              <div className="summary-row">
                <p>Bundle Description: </p>
                <p>{selectedBundel.description}</p>
              </div>
            </>
          )}

          {addonAmount > 0 && (
            <div className="summary-row">
              <p>Add-ons</p>
              <p>€{addonAmount.toFixed(2)}</p>
            </div>
          )}

          <div className="summary-row">
            <p>Administration Fees</p>
            <p>€{ADMIN_FEE.toFixed(2)}</p>
          </div>

          {voucherData && (
            <div className="summary-row" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              <p>Coupon Discount ({voucherData.voucher.discountType === 'percentage' ? `${voucherData.voucher.discountValue}%` : `€${voucherData.voucher.discountValue}`})</p>
              <p>-€{voucherData.discountAmount.toFixed(2)}</p>
            </div>
          )}

          <div className="total">
            <p>Total: €{totalPrice.toFixed(2)}</p>
            <small>Taxes & Expenses included</small>
          </div>
        </div>

        <div className="timer">
          <p>Tickets will remain reserved for 10 minutes</p>
          <p>{formatTime(timer)}</p>
        </div>

        <h3>Personal Details</h3>
        <p className="note">
          Once Purchase is accepted it will not be exchanged or refunded for others.
        </p>

        <div className="form-grid">
          <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
          <input type="text" name="surname" placeholder="Surname" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="email" name="repeatEmail" placeholder="Repeat Email" onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Telephone" onChange={handleChange} required />
          <input type="text" name="postalCode" placeholder="Postal Code" onChange={handleChange} required />
        </div>

        {/* Voucher/Coupon Section */}
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#b570ea' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>🎫 Have a Coupon Code?</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              name="couponCode"
              placeholder="Enter coupon code"
              value={formData.couponCode}
              onChange={handleChange}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={validateVoucher}
              disabled={voucherLoading || !formData.couponCode.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: voucherLoading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: voucherLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {voucherLoading ? 'Validating...' : 'Apply'}
            </button>
            {voucherData && (
              <button
                type="button"
                onClick={clearVoucher}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Remove
              </button>
            )}
          </div>

          {/* Voucher Status Messages */}
          {voucherError && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px 12px', 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              ❌ {voucherError}
            </div>
          )}

          {voucherData && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px 12px', 
              backgroundColor: '#e8f5e8', 
              color: '#2e7d32', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              ✅ Coupon applied! You saved €{voucherData.discountAmount.toFixed(2)}
            </div>
          )}
        </div>

        <div className="terms">
          {[
            "By clicking 'Accept', you agree to our Terms and Conditions and Privacy Policy",
            
          ].map((text, index) => (
            <label key={index} className="checkbox-label">
              <input
                type="checkbox"
                className="circle-checkbox"
                checked={formData.termsAccepted[index]}
                onChange={() => handleCheckboxChange(index)}
              />
              {text}
            </label>
          ))}
        </div>

        <div className="submit-row modal-actions">
          <button className="modal-btn cancel" onClick={onClose} style={{
             marginRight: '10px'
          }}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
