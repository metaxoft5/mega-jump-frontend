import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import PaymentConfirmed from "../components/PaymentConfirmed";
import axios from "axios";

const BASE_URL = "https://api.megajumpparktickets.eu";
const HEADERS = {
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
};

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    const fetchTicket = async () => {
      if (!sessionId) {
        setError(t('errors.sessionExpired'));
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/api/payment/session-result/${sessionId}`, {
          headers: HEADERS,
        });

        if (res.data?.success && res.data.ticket) {
          setTicketData(res.data.ticket);
        } else {
          setError(res.data.message || t('errors.ticketNotRetrieved'));
        }
      } catch (err) {
        console.error("❌ Error fetching ticket:", err);
        setError(t('errors.fetchFailed'));
      }
    };

    fetchTicket();
  }, [sessionId]);

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ {t('booking.paymentFailed')}</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/ticket-booking")}>{t('booking.backToTicketBooking')}</button>
      </div>
    );
  }

  if (!ticketData) return <div>{t('booking.loadingTicketConfirmation')}</div>;

  return (
    <div className="container">
      <PaymentConfirmed
        ticketData={ticketData}
        onReturnToHome={() => navigate("/")}
        onCancelRequest={() => navigate(`/ticket-booking?cancel=true&ticketId=${ticketData.ticketId}`)}
      />
    </div>
  );
};

export default PaymentSuccess;
