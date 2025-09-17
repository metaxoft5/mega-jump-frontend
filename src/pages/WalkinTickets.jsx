import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Calendar from "react-calendar";
import { Heading } from "../components/Heading";
import axios from "axios";
import Heart from "../assets/heart.png";
import TicketPDFGenerator from "../components/TicketPDFGenerator";
import PaymentConfirmed from "../components/PaymentConfirmed"; // ✅ New import

const statusColors = {
  few: "#D1E942",
  full: "#00C2FF",
  veryfull: "#F53E3E",
};

const BASE_URL = "https://api.megajumpparktickets.eu";

export default function WalkInTicket() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [tickets, setTickets] = useState(0);
  const [socks, setSocks] = useState(0);
  const [timeOptions, setTimeOptions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [bundels, setBundels] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [showPaymentConfirmed, setShowPaymentConfirmed] = useState(false); // ✅ New state

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [isCashPayment, setIsCashPayment] = useState(false); // Always false for regular walk-in tickets
  const [couponCode, setCouponCode] = useState("");
  const [voucherData, setVoucherData] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/settings`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        setSettings(Array.isArray(res.data) ? res.data[0] : res.data);
      } catch (error) {
        console.error("⚠️ Failed to fetch settings:", error);
      }
    };

    const fetchBundels = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/ticketbundels`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        setBundels(Array.isArray(res.data) ? res.data : res.data.data || []);
      } catch (error) {
        console.error("⚠️ Failed to fetch bundles:", error);
      }
    };

    fetchBundels();
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;
  
      // ✅ Format date as local YYYY-MM-DD
      const dateStr = selectedDate.toLocaleDateString("en-CA"); // en-CA outputs YYYY-MM-DD in local time
  
      try {
        const res = await axios.get(`${BASE_URL}/api/timeslots/${dateStr}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const slots = Array.isArray(res.data) ? res.data : res.data.data || [];
        const todaySlots = slots.filter((s) => s.date === dateStr);
  
        setTimeOptions(
          todaySlots.map((s) => ({
            id: s._id,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            maxTickets: s.maxTickets || 0,
            totalBooked: s.totalBooked || 0,
            availableTickets: s.availableTickets || 0,
            isFullyBooked: s.isFullyBooked || false,
            status: s.isFullyBooked ? "veryfull" : s.availableTickets < 10 ? "full" : "few"
          }))
        );
      } catch (error) {
        console.error("⚠️ Failed to fetch time slots:", error);
      }
    };
  
    fetchTimeSlots();
  }, [selectedDate]);
  

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("sessionId");
    const session = urlParams.get("session");
    if (session === "success" && sessionId) {
      fetchTicketBySession(sessionId);
    }
  }, []);

  const fetchTicketBySession = async (sessionId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/payment/session-result/${sessionId}`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (res.data.success) {
        setTicketData(res.data.ticket);
        setShowPaymentConfirmed(true); // ✅ show confirmation
      } else {
        alert(t('errors.ticketNotRetrieved'));
      }
    } catch (error) {
      console.error("❌ Error fetching ticket:", error);
      alert(t('errors.fetchFailed'));
    }
  };

  const validateVoucher = async () => {
    if (!couponCode.trim()) {
      setVoucherError(t('booking.enterCouponCode'));
      setVoucherData(null);
      return;
    }

    setVoucherLoading(true);
    setVoucherError("");

    try {
      const response = await axios.post(`${BASE_URL}/api/discount-vouchers/validate`, {
        code: couponCode.toUpperCase(),
        amount: subtotal- voucherDiscount
      }, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      if (response.data.success) {
        setVoucherData(response.data.data);
        setVoucherError("");
      } else {
        setVoucherError(response.data.message || t('booking.invalidVoucher'));
        setVoucherData(null);
      }
    } catch (error) {
      console.error("Voucher validation error:", error);
      setVoucherError(error.response?.data?.message || t('booking.voucherValidationFailed'));
      setVoucherData(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const clearVoucher = () => {
    setVoucherData(null);
    setVoucherError("");
    setCouponCode("");
  };

  const ticketPrice = settings?.ticketPrice || 0;
  const socksPrice = settings?.socksPrice || 0;
  const bundleDiscount = selectedBundle ? selectedBundle.price * (selectedBundle.discountPercent / 100) : 0;
  const bundleNetPrice = selectedBundle ? selectedBundle.price - bundleDiscount : 0;
  const baseTicketAmount = tickets * ticketPrice;
  const socksAmount = socks * socksPrice;
  const totalCancellationFee = 0; // cancellationEnabled is not used
  const totalAddOnAmount = socksAmount + totalCancellationFee;
  const amount = ticketPrice;
  const totalBaseAmount = baseTicketAmount;
  const ADMIN_FEE = 2.5;
  
  // Calculate base total before voucher discount
  const baseTotal = baseTicketAmount + socksAmount + bundleNetPrice + totalCancellationFee + ADMIN_FEE;
  
  // Apply voucher discount if available
  const voucherDiscount = voucherData ? voucherData.discountAmount : 0;
  const subtotal = baseTotal - voucherDiscount;
  console.log(subtotal);

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime || !selectedEndTime || !name || !surname || !email || (tickets <=0 && selectedBundle === false) ) {
      alert(t('errors.invalidInput'));
      return;
    }

    const payload = {
      date: selectedDate.toLocaleDateString("en-CA"), 
      startTime: selectedTime,
      endTime: selectedEndTime,
      tickets,
      socksCount: socks,
      selectedBundel: selectedBundle,
      name,
      surname,
      email,
      isCashPayment,
      amount,
      totalBaseAmount,
      totalAddOnAmount,
      cancellationEnabled: false, // always false
      cancellationFee: totalCancellationFee,
      subtotal,
      paymentMethod: "card",
      couponCode: voucherData ? voucherData.voucher.code : null,
      voucherData: voucherData ? {
        code: voucherData.voucher.code,
        discountAmount: voucherData.discountAmount,
        originalAmount: voucherData.originalAmount,
        finalAmount: voucherData.finalAmount
      } : null,
      addonData: {
        socksCount: socks,
        cancellationEnabled: false, // always false
        cancellationFee: totalCancellationFee,
        totalAddOnAmount,
      },
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/walkin/book`, payload);
      if (response.data.success) {
        if (isCashPayment) {
          setTicketData(response.data.ticket || payload);
        } else if (response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        }
      } else {
        alert(response.data.message || t('errors.paymentFailed'));
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert(t('errors.paymentFailed'));
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setSelectedTime(null);
    setSelectedEndTime(null);
    setTickets(0);
    setSocks(0);
    setSelectedBundle(null);
    setName("");
    setSurname("");
    setEmail("");
    setTicketData(null);
    setShowPaymentConfirmed(false);
    setIsCashPayment(false);
  };

  // Modal styles for overlay and content
  const modalStyles = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(30, 30, 30, 0.6);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      padding: 32px 24px;
      z-index: 1001;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }
  `;

  // Inject modal styles into the document head
  useEffect(() => {
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.innerHTML = modalStyles;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    const sessionId = urlParams.get('sessionId');

    // Use environment variable for backend base URL
    const BASE_URL_ENV = import.meta.env.BASE_URL || "https://api.megajumpparktickets.eu";

    if (session === 'success' && sessionId) {
      // Call your backend verify-payment API with full URL
      fetch(`${BASE_URL_ENV}/api/payment/verify-payment?sessionId=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('Payment verification response:', data);
          if (data.success) {
            // Optionally update UI or state here
            console.log('Payment is successful and verified.');
          } else {
            console.warn('Payment verification failed or incomplete.');
          }
        })
        .catch((err) => {
          console.error('Error verifying payment:', err);
        });
    }
  }, []);

  return (
    <div className="bg-purple parent-container">
      <div className="container">
      <div className="heading-wrapper"><Heading /></div>

      <div className="venue-container center-align">
        <div className="venue-tag">
          <img src={Heart} alt="heart" className="emoji" />
          <span className="venue-text">{settings?.locationName || "Venue"}</span>
        </div>
        <div className="dates">
          {settings?.startDate && settings?.endDate
            ? `${new Date(settings.startDate).toLocaleDateString()} – ${new Date(settings.endDate).toLocaleDateString()}`
            : t('common.loading')}
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          minDate={settings?.startDate ? new Date(settings.startDate) : undefined}
          maxDate={settings?.endDate ? new Date(settings.endDate) : undefined}
        />
      </div>

      <div className="time-selector">
        <h2>{t('booking.selectTime')}</h2>
        <div className="pill-container">
          {timeOptions.map((slot) => (
            <button
              key={slot.id}
              className={`pill-btn ${selectedTime === slot.startTime ? "active" : ""}`}
              style={{ backgroundColor: statusColors[slot.status] }}
              onClick={() => {
                setSelectedTime(slot.startTime);
                setSelectedEndTime(slot.endTime);
              }}
              title={`${slot.startTime} - ${slot.endTime}
Max Tickets: ${slot.maxTickets}
Booked: ${slot.totalBooked}
Available: ${slot.availableTickets}
Status: ${slot.isFullyBooked ? 'Fully Booked' : 'Available'}`}
            >
              {slot.startTime}
            </button>
          ))}
        </div>
        {selectedDate && selectedTime && (
          <div className="selected-date">
            <p>{`${new Date(selectedDate).toLocaleDateString()} – ${selectedTime}`}</p>
          </div>
        )}
      </div>

      {/* Ticket Count */}
      <div className="ticket-counter-wrapper">
        <div className="pill-big">
          <div className="text"><h3>{t('admin.tickets')}</h3></div>
          <div className="counter-wrapper">
            <p>€{baseTicketAmount.toFixed(2)}</p>
            <div className="ticket-counter">
              <button onClick={() => setTickets((prev) => (prev > 0 ? prev - 1 : 0))} className="counter-btn">–</button>
              <span className="ticket-count">{tickets}</span>
              <button onClick={() => setTickets((prev) => prev + 1)} className="counter-btn">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Socks */}
      <div className="ticket-counter-wrapper">
        <div className="pill-big">
          <div className="text"><h3>{t('admin.socks')}</h3></div>
          <div className="counter-wrapper">
            <p>€{socksAmount.toFixed(2)}</p>
            <div className="ticket-counter">
              <button onClick={() => setSocks((prev) => (prev > 0 ? prev - 1 : 0))} className="counter-btn">–</button>
              <span className="ticket-count">{socks}</span>
              <button onClick={() => setSocks((prev) => prev + 1)} className="counter-btn">+</button>
            </div>
          </div>
        </div>
      
      </div>


      {/* Bundles */}
      <div className="bundle-tickets">
      <h3>{t('booking.socksMandatory')}</h3>
     
        <h3>{t('booking.bundleTickets')}</h3>
        
        {/* Selected Bundle Display */}
        {selectedBundle && (
          <div className="selected-bundle-display" style={{
            background: '#4CAF50',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{t('booking.selected')}: {selectedBundle.name}</h4>
              <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>€{selectedBundle.price.toFixed(2)} - {selectedBundle.description}</p>
            </div>
            <button 
              onClick={() => setSelectedBundle(null)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="bundle-tickets-container pill-container">
          {bundels.map((bundle) => (
            <button
              key={bundle._id}
              className={`bundle-ticket-item ${selectedBundle?._id === bundle._id ? "active" : ""}`}
              onClick={() => setSelectedBundle(bundle)}
            >
              <h4>{bundle.name}</h4>
              <p>{bundle.description}</p>
              <p>€{bundle.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* User Info */}
      <div className="input-wrapper">
        <input type="text" placeholder={t('booking.firstName')} value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        <input type="text" placeholder={t('booking.lastName')} value={surname} onChange={(e) => setSurname(e.target.value)} className="input-field" />
        <input type="email" placeholder={t('booking.email')} value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
      </div>

        {/* Voucher/Coupon Section */}
        <div style={{ 
            marginBottom: '16px', 
            padding: '15px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            backgroundColor: '#f9f9f9' 
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>🎫 {t('booking.haveCouponCode')}</h3>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder={t('booking.enterCouponCode')}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
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
                disabled={voucherLoading || !couponCode.trim()}
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
                {voucherLoading ? t('booking.validating') : t('booking.apply')}
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
                    {t('booking.remove')}
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
                ✅ {t('booking.couponApplied')} €{voucherData.discountAmount.toFixed(2)}
              </div>
            )}
          </div>

      {/* Cash payment option is hidden for regular walk-in tickets */}
      {/* Only available in admin cash payment mode */}

      {subtotal > 0 && (
        <div className="total-wrapper">
          {/* Price Breakdown */}
          <div className="price-breakdown" style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {baseTicketAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{tickets} x {t('booking.individualTickets')}:</span>
                <span>€{baseTicketAmount.toFixed(2)}</span>
              </div>
            )}
            
            {selectedBundle && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{t('booking.bundle')}: {selectedBundle.name}</span>
                  <span>€{selectedBundle.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc3545' }}>
                  <span>{t('booking.discount')} ({selectedBundle.discountPercent}%):</span>
                  <span>-€{bundleDiscount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                  <span>{t('booking.bundleNetPrice')}:</span>
                  <span>€{bundleNetPrice.toFixed(2)}</span>
                </div>
              </>
            )}
            
            {socksAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{socks} x {t('admin.socks')}:</span>
                <span>€{socksAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{t('booking.adminFee')}:</span>
              <span>€{ADMIN_FEE.toFixed(2)}</span>
            </div>
            
            <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
            
            {voucherData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4CAF50', fontWeight: 'bold' }}>
                <span>{t('booking.couponDiscount')} ({voucherData.voucher.discountType === 'percentage' ? `${voucherData.voucher.discountValue}%` : `€${voucherData.voucher.discountValue}`})</span>
                <span>-€{voucherData.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
              <span>{t('booking.total')}:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
          </div>

        
          
          <div className="total-count">{t('booking.total')}: €{subtotal.toFixed(2)}</div>
          <button className="btn" onClick={handlePayment}>{t('booking.proceedToPayment')}</button>
        </div>
      )}

      {/* 🧾 Show PDF for cash payment */}
      {ticketData  && (
        <TicketPDFGenerator ticketData={ticketData} onDone={() => setTicketData(null)}   />
      )}

      {/* ✅ Show confirmation modal for card (Stripe) payments */}
      {ticketData && showPaymentConfirmed && (
        <div className="modal-overlay">
          <div className="modal-content">
            <PaymentConfirmed
                   settings={settings}
              ticketData={ticketData}
              onReturnToHome={resetForm}
              onCancelRequest={() => alert("Cancel requested")}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
