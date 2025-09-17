import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import cardPopup from "../assets/cardpopup.webp";

export const GroundCard = ({ onBuyTicket }) => {
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const BASE_URL = "https://api.megajumpparktickets.eu";
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await axios.get(
          ` https://api.megajumpparktickets.eu/api/settings`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
              Accept: "application/json",
            },
          }
        );
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (data) {
          setEvent(data);
          console.log("✅ Settings:", data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch settings:", error);
      }
    };
    fetchSetting();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      
     
      
    });
  };

  if (!event) return null; // or a loader

  return (
    <div className="card-wrapper">
      <div className="single-relative">
        <img src={cardPopup} alt="card popup" className="cardpopup" />
        <div className="card-border">
          <div className="card">
            <div className="card-body-wrapper">
              <div className="location">{event.locationName}</div>
              <div className="venue">{event.address}</div>
              <div className="dates">
                {formatDate(event.startDate)} – {formatDate(event.endDate)}
              </div>
              <button className="btn" onClick={onBuyTicket}>{t('booking.buyNow')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
