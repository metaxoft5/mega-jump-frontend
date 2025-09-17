import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Calendar from "react-calendar";
import { Heading } from "../components/Heading";
import axios from "axios";
import Heart from "../assets/heart.png";
import TicketPDFGenerator from "../components/TicketPDFGenerator";
import PaymentConfirmed from "../components/PaymentConfirmed";

const statusColors = {
  few: "#D1E942",
  full: "#00C2FF",
  veryfull: "#F53E3E",
};

const BASE_URL = "https://api.megajumpparktickets.eu";

export default function AdminCashPayment() {
  const { t } = useTranslation();
  const [isAuthenticated] = useState(true); // Always true since ProtectedRoute handles auth
  
  // Remove the duplicate authentication check since ProtectedRoute handles it
  // useEffect(() => {
  //   const checkAuth = () => {
  //     const adminRole = sessionStorage.getItem("adminRole");
  //     const adminUsername = sessionStorage.getItem("adminUsername");
  //     
  //     console.log("🔐 Checking authentication...");
  //     console.log("Admin Role:", adminRole);
  //     console.log("Admin Username:", adminUsername);
  //     console.log("Current URL:", window.location.href);
  //     
  //     // Only allow cashier role to access cash payment page
  //     if (!adminRole || !adminUsername || adminRole !== "cashier") {
  //       console.log("❌ AdminCashPayment - Authentication failed - redirecting to login");
  //       console.log("Expected role: cashier, Got role:", adminRole);
  //       // Clear any existing session data to prevent loops
  //       sessionStorage.removeItem("adminRole");
  //       sessionStorage.removeItem("adminUsername");
  //       window.location.href = "/admin/login";
  //       return;
  //     }
  //     
  //     console.log("✅ Authentication successful");
  //     setIsAuthenticated(true);
  //   };
  //   
  //   // Add a longer delay to ensure session storage is properly set after login
  //   const timer = setTimeout(checkAuth, 500);
  //   
  //   return () => clearTimeout(timer);
  // }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [tickets, setTickets] = useState(0);
  const [halfTimeTickets, setHalfTimeTickets] = useState(0);
  const [socks, setSocks] = useState(0);
  const [timeOptions, setTimeOptions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [bundels, setBundels] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [showPaymentConfirmed, setShowPaymentConfirmed] = useState(false);

  

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

  // Debug state changes
  useEffect(() => {
    console.log('🔍 State updated:', {
      tickets,
      halfTimeTickets,
      socks,
      selectedBundle: selectedBundle?.name,
      selectedTime,
      selectedEndTime
    });
  }, [tickets, halfTimeTickets, socks, selectedBundle, selectedTime, selectedEndTime]);
  
  
  const ticketPrice = settings?.ticketPrice || 0;
  const halfTimeTicketPrice = 9; // Half-time tickets are 50% of regular price
  const socksPrice = settings?.socksPrice || 0;
  const bundleDiscount = selectedBundle ? selectedBundle.price * (selectedBundle.discountPercent / 100) : 0;
  const bundleNetPrice = selectedBundle ? selectedBundle.price - bundleDiscount : 0;
  const baseTicketAmount = tickets * ticketPrice;
  const halfTimeTicketAmount = halfTimeTickets * halfTimeTicketPrice;
  const socksAmount = socks * socksPrice;
  const totalCancellationFee = 0;
  const totalAddOnAmount = socksAmount + totalCancellationFee;
 
  const totalBaseAmount = baseTicketAmount + halfTimeTicketAmount;
  const amount = totalBaseAmount ;
  const subtotal = totalBaseAmount + socksAmount + bundleNetPrice + totalCancellationFee;

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime || !selectedEndTime) {
      alert(t('errors.invalidInput'));
      return;
    }
    
    // Check if at least one ticket type is selected
    if (tickets <= 0 && halfTimeTickets <= 0 && !selectedBundle) {
      alert("Please select at least one ticket type (Full-Time, Half-Time, or Bundle)");
      return;
    }
 

    const payload = {
      date: selectedDate.toLocaleDateString("en-CA"), // Use same format as time slot fetching
      startTime: selectedTime,
      endTime: selectedEndTime,
      tickets,
      halfTimeTickets,
      socksCount: socks,
      selectedBundel: selectedBundle,
      name: "cash payment",
      surname: "cash payment",
      email: "megajump08@gmail.com",
      isCashPayment: true, // Always true for admin cash payment
      amount,
      totalBaseAmount,
      totalAddOnAmount,
      cancellationEnabled: false,
      cancellationFee: totalCancellationFee,
      subtotal,
      paymentMethod: "cash",
      addonData: {
        socksCount: socks,
        cancellationEnabled: false,
        cancellationFee: totalCancellationFee,
        totalAddOnAmount,
      },
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/walkin/book`, payload);
      if (response.data.success) {
        setTicketData(response.data.ticket || payload);
        setShowPaymentConfirmed(true);
        console.log(response.data);
        
        // Reset form immediately after successful payment
        setTimeout(() => {
          console.log('🔄 Auto-resetting form after payment...');
          setSelectedDate(new Date());
          setSelectedTime(null);
          setSelectedEndTime(null);
          setTickets(0);
          setHalfTimeTickets(0);
          setSocks(0);
          setSelectedBundle(null);
        }, 100);
      } else {
        alert(response.data.message || t('errors.paymentFailed'));
        
      }

    
    } catch (err) {
      console.error("Payment Error:", err);
      alert(err.response.data.message);
       
    }
  };

  const resetForm = () => {
    console.log('🔄 Resetting form...');
    setSelectedDate(new Date());
    setSelectedTime(null);
    setSelectedEndTime(null);
    setTickets(0);
    setHalfTimeTickets(0);
    setSocks(0);
    setSelectedBundle(null);
    setTicketData(null);
    setShowPaymentConfirmed(false);
    console.log('✅ Form reset complete');
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
  }, [modalStyles]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="bg-purple parent-container">
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          color: 'white',
          fontSize: '18px'
        }}>
          🔐 Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple parent-container">
      <div className="container">
      <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '10px',
            gap: '15px'
          }}>
            <div style={{ 
              background: '#ff6b6b', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              🔐 {t('admin.cashPaymentMode')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* <span style={{ color: '#666', fontSize: '14px' }}>
                {t('common.welcome')}, {sessionStorage.getItem("adminUsername")}
              </span> */}
              <button 
                onClick={() => {
                  sessionStorage.removeItem("adminRole");
                  sessionStorage.removeItem("adminUsername");
                  window.location.href = "/admin/login";
                }}
                style={{ 
                  background: "#f44336", 
                  color: "white", 
                  border: "none", 
                  padding: "12px 22px", 
                  borderRadius: "5px", 
                  cursor: "pointer",
                  fontSize: '12px'
                }}
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        <div className="heading-wrapper">
          <Heading />
          
          {/* Manual Reset Button */}
          <button 
            onClick={resetForm}
            style={{ 
              background: '#ff9800', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '20px'
            }}
          >
            🔄 Reset Form
          </button>
        </div>
 
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

        {/* Half-Time Ticket Count */}
        <div className="ticket-counter-wrapper">
          <div className="pill-big">
            <div className="text"><h3>Half-Time {t('admin.tickets')}</h3></div>
            <div className="counter-wrapper">
              <p>€{halfTimeTicketAmount.toFixed(2)}</p>
              <div className="ticket-counter">
                <button onClick={() => setHalfTimeTickets((prev) => (prev > 0 ? prev - 1 : 0))} className="counter-btn">–</button>
                <span className="ticket-count">{halfTimeTickets}</span>
                <button onClick={() => setHalfTimeTickets((prev) => prev + 1)} className="counter-btn">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Regular Ticket Count */}
        <div className="ticket-counter-wrapper">
          <div className="pill-big">
            <div className="text"><h3>Full-Time {t('admin.tickets')}</h3></div>
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

        {/* User Info hidden for cash payments */}

        {/* Admin Cash Payment Indicator */}
        <div className="payment-method" style={{ 
          background: '#4CAF50', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '8px', 
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          💰 {t('admin.cashPaymentMode')} - {t('admin.adminOnly')}
        </div>

        {subtotal > 0 && (
          <div className="total-wrapper">
            {/* Price Breakdown */}
            <div className="price-breakdown" style={{
              background: '#cbdb2a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: 'black'
            }}>
              {halfTimeTicketAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{halfTimeTickets} x Half-Time {t('booking.individualTickets')}:</span>
                  <span>€{halfTimeTicketAmount.toFixed(2)}</span>
                </div>
              )}
              
              {baseTicketAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{tickets} x Full-Time {t('booking.individualTickets')}:</span>
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
               
              </div>
              
              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
              
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
        {ticketData && (
          <TicketPDFGenerator ticketData={ticketData} onDone={() => setTicketData(null)} source="adminCashPayment" />
        )}

        {/* ✅ Show confirmation modal for cash payments */}
        {ticketData && showPaymentConfirmed && (
          <div className="modal-overlay">
            <div className="modal-content">
              <PaymentConfirmed
                ticketData={ticketData}
                settings={settings}
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