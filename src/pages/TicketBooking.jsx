import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import germ1 from "../assets/germ1.png";
import germ2 from "../assets/germ2.png";
import Calendar from "../components/Calendars";
import { GroundCard } from "../components/GroundCard";
import { Heading } from "../components/Heading";
import AddOnModal from "../components/AddOnModal";
import { PaymentDetailsModal } from "../components/PaymentDetailsModal";
import axios from "axios";
import Guidelines from "../components/Guidelines";
import TicketPDFGenerator from "../components/TicketPDFGenerator";
import PaymentConfirmed from "../components/PaymentConfirmed";
import CancelTicket from "../components/CancelTicket";
import { trackPurchase, trackViewContent } from "../utils/facebookPixel";

const BASE_URL = "https://api.megajumpparktickets.eu";
const HEADERS = {
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
};

const apiClient = {
  post: (endpoint, data) => axios.post(`${BASE_URL}${endpoint}`, data, { headers: HEADERS }),
  get: (endpoint) => axios.get(`${BASE_URL}${endpoint}`, { headers: HEADERS }),
};

const fetchTicketWithRetry = async (sessionId, maxAttempts = 5, delay = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await apiClient.get(`/api/payment/session-result/${sessionId}`);
      if (res.status === 200 && res.data?.ticket) {
        return res.data.ticket;
      }
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("Ticket not available after multiple retries.");
};

const TicketBooking = () => {
  const { t } = useTranslation();
  const [buyTicket, setBuyTicket] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [addOns, setAddOns] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [searchParams] = useSearchParams();
  const [selectedBundle, setSelectedBundle] = useState();
  const [settings, setSettings] = useState(null);

  const ADMIN_FEE = 2.5;

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

    fetchSettings();
  }, []);

  useEffect(() => {
    const session = searchParams.get("session");
    const sessionId = searchParams.get("sessionId");

    if (session === "success" && sessionId && !confirmedTicket) {
      fetchTicketWithRetry(sessionId)
        .then((ticket) => {
          setConfirmedTicket(ticket);
          setShowPdf(true);
          window.history.replaceState(null, "", "/ticket-booking");
          
          // Facebook Pixel Purchase Event
          if (window.fbq && ticket) {
            const eventId = `purchase_${sessionId}_${Date.now()}`;
            const purchaseValue = ticket.subtotal || ticket.amount || 0;
            
            // Track purchase using utility function
            trackPurchase(purchaseValue, 'EUR', eventId);
            
            // Store event_id for server-side deduplication
            localStorage.setItem('fb_purchase_event_id', eventId);
            localStorage.setItem('fb_purchase_value', purchaseValue);
            localStorage.setItem('fb_purchase_currency', 'EUR');
          }
        })
        .catch((err) => {
          alert(t('errors.ticketNotRetrieved') + err);
        });
    }
  }, [searchParams, confirmedTicket]);

  const handleSelection = (selection) => {
    setSelectedData(selection);
    setSelectedBundle(selection.selectedBundel);
    console.log("selection",selection);
    
    // Track ViewContent event for ticket selection
    if (selection && selection.totalBaseAmount) {
      trackViewContent('Ticket Selection', selection.totalBaseAmount, 'EUR');
    }
  };

  const calculateSubtotal = (baseAmount, addOnAmount = 0, bundle) => {
    const bundleDiscount = bundle ? bundle.price * (bundle.discountPercent / 100) : 0;
    const bundleNet = bundle ? (bundle.price - bundleDiscount) : 0;
    return baseAmount + addOnAmount + ADMIN_FEE + bundleNet;
  };

  const handleAddOnsSubmit = (data) => {
    setAddOns(data);
    setShowAddOnModal(false);
    setShowPaymentModal(true);

    if (selectedData) {
      const baseAmount = selectedData.totalBaseAmount;   // Correct ticket total
      const newSubtotal = calculateSubtotal(baseAmount, data.totalAddOnAmount, selectedData.selectedBundel);
      setSubtotal(newSubtotal);
    }
  };

  const handlePaymentSubmit = async (customerData) => {
    setShowPaymentModal(false);
  
    // Use the voucher-adjusted total from PaymentDetailsModal if available
    const finalSubtotal = customerData.totalAmount || 
      (subtotal || calculateSubtotal(
        selectedData.totalBaseAmount,
        addOns?.totalAddOnAmount,
        selectedData.selectedBundel
      ));
  
    const finalPayload = {
      ...selectedData,
      ...addOns,
      ...customerData,
      subtotal: finalSubtotal,
      paymentMethod: "card",
    };
  
    try {
      const res = await apiClient.post("/api/payment/session", finalPayload);
      const { sessionId, checkoutUrl } = res.data;
      
      if (sessionId && checkoutUrl) {
        window.location.href = checkoutUrl;  // Redirect to Stripe Checkout
      } else {
        throw new Error("Invalid payment session response.");
      }
    } catch (err) {
      console.error("❌ Payment session creation error:", err);
      const message = err?.response?.data?.message || "Something went wrong during payment.";
      alert(message);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("confirmedTicket",confirmedTicket)
    console.log("searchParams",searchParams)
    console.log("urlParams",urlParams)
    const session = searchParams.get('session');
    const sessionId = searchParams.get("sessionId");
    console.log("session",session)
    console.log("sessionId",sessionId) 

    // Use environment variable for backend base URL
    const BASE_URL = import.meta.env.BASE_URL || "https://api.megajumpparktickets.eu";

    if (session === 'success' && sessionId) {
      // Call your backend verify-payment API with full URL
      fetch(`${BASE_URL}/api/payment/verify-payment?sessionId=${encodeURIComponent(sessionId)}`)
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
    <div className="parent-container">
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        {/* Admin Login button placeholder */}
      </div>

      <div className="germs">
        <img src={germ1} alt="decor" className="germ1" />
        <div className="germ2"><img src={germ2} alt="decor" /></div>
        <img src={germ2} alt="decor" className="germ3" />
      </div>

      <div className="container">
        <div className="heading-wrapper">
          <Heading />
        </div>

        {showCancel ? (
          <CancelTicket ticketData={confirmedTicket} />
        ) : confirmedTicket ? (
          <PaymentConfirmed
          settings={settings}
            ticketData={confirmedTicket}
            onReturnToHome={() => {
              setConfirmedTicket(null);
              setBuyTicket(false);
              setSelectedData(null);
              setAddOns(null);
              setSubtotal(0);
              setShowCancel(false);
              setShowPdf(false);
            }}
            onCancelRequest={() => setShowCancel(true)}
          />
        ) : !buyTicket ? (
          <GroundCard onBuyTicket={() => setBuyTicket(true)} />
        ) : (
          <>
            <Calendar onAddSelection={handleSelection} />
            <Guidelines />
          </>
        )}

        {buyTicket && selectedData && !confirmedTicket && (
          <div className="total-wrapper">
            <div className="total-count">{t('booking.total')}: €{( selectedData.amount).toFixed(2)}</div>
            <button className="btn" onClick={() => setShowAddOnModal(true)}>
              {t('booking.proceedToPayment')}
            </button>
          </div>
        )}
      </div>

      {showAddOnModal && (
        <AddOnModal
          ticketCount={selectedData?.tickets || 1}
          onClose={() => setShowAddOnModal(false)}
          onSubmit={handleAddOnsSubmit}
        />
      )}

      {showPaymentModal && (
        <PaymentDetailsModal
          addonData={addOns}
          amount={selectedData?.amount}
          ticketCount={selectedData?.tickets}
          selectedDate={selectedData?.date}
          startTime={selectedData?.startTime}
          endTime={selectedData?.endTime}
          bundelSelected={selectedData?.bundelSelected}
          selectedBundel={selectedBundle}
          totalBaseAmount={selectedData?.totalBaseAmount}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {confirmedTicket && showPdf && (
        <TicketPDFGenerator
          ticketData={confirmedTicket}
          onDone={() => setShowPdf(false)}
        />
      )}
    </div>
  );
};

export default TicketBooking;
