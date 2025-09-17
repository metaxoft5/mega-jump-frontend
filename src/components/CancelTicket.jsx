import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ticketHeader from "../assets/cancel-logo.png";
import footerCharacters from "../assets/footer-characters.webp";

const CancelTicket = ({ ticketData }) => {
  const [requestSent, setRequestSent] = useState(false);
  const { t } = useTranslation();

  const BASE_URL = "https://api.megajumpparktickets.eu";

  const handleCancelRequest = async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/cancel-request`,
        {
          ticketId: ticketData.ticketId,
          email: ticketData.email,
          reason: "User requested cancellation",
        },
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        }
      );
      setRequestSent(true);
    } catch (err) {
      console.error("❌ Cancel request failed:", err);
      alert(t('errors.cancelRequestFailed'));
    }
  };

  return (
    <div className="cancel-page">
      <div className="header-box">
        <div className="images-are">
          <h5>
            {t('cancellation.biggestInflatable')}
            <br />
            {t('cancellation.parkInWorld')}
          </h5>
          <img src={ticketHeader} alt="Mega Jump Ticket Header" className="header-img" />
        </div>

        <div className="cancel-ticket-details">
          <p><strong>{t('cancellation.ticketId')}:</strong> {ticketData.ticketId}</p>
          <p><strong>{t('cancellation.name')}:</strong> {ticketData.name}</p>
          <p><strong>{t('cancellation.surname')}:</strong> {ticketData.surname}</p>
          <p><strong>{t('cancellation.email')}:</strong> {ticketData.email}</p>
          <p><strong>{t('cancellation.phone')}:</strong> {ticketData.phone}</p>
          <p><strong>{t('cancellation.postalCode')}:</strong> {ticketData.postalCode}</p>
          <p><strong>{t('cancellation.eventDate')}:</strong> {ticketData.date}</p>
          <p><strong>{t('cancellation.slot')}:</strong> {ticketData.startTime} - {ticketData.endTime}</p>
          {ticketData.createdAt && (
            <p>
              <strong>{t('cancellation.dateTime')}:</strong>{" "}
              {new Date(ticketData.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
            </p>
          )}
          <p><strong>{t('cancellation.confirmationEmailSentTo')}:</strong> {ticketData.email}</p>
        </div>
      </div>

      <div className="button-section">
        <button className="info-button">
          {t('cancellation.howDoesCancellationWork')}
        </button>
      </div>

      <div className="refund-card-section">
        {[1, 2, 3].map((_, index) => (
          <div className="refund-card" key={index}>
            <div className="circle" />
            <button className="refund-button">{t('cancellation.refund')}</button>
            <p className="refund-text">
              {t('cancellation.refundDescription')}
            </p>
          </div>
        ))}
      </div>

      {!requestSent ? (
        <div className="cancel-submit">
          <button className="modal-btn cancel" onClick={handleCancelRequest}>
            {t('cancellation.requestToCancel')}
          </button>
        </div>
      ) : (
        <div className="cancel-success-msg">
          <p>✅ {t('cancellation.requestSubmitted')}</p>
        </div>
      )}

      <div className="footer-image">
        <img src={footerCharacters} alt="Footer Decoration" />
      </div>
    </div>
  );
};

export default CancelTicket;
