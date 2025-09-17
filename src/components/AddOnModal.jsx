import React, { useState, useEffect } from "react";
import Socks from "../assets/socks.png";
import axios from "axios";

const BASE_URL = "https://api.megajumpparktickets.eu";

const AddOnModal = ({ onClose, onSubmit, ticketCount }) => {
  const [socks, setSocks] = useState(0);
  const [cancellation, setCancellation] = useState(false);
  const [sockPrice, setSockPrice] = useState(0);
  const [cancellationFee, setCancellationFee] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/settings`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        });

        const settings = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (settings?.socksPrice != null) {
          setSockPrice(settings.socksPrice);
        }

        if (settings?.cancellationFee != null) {
          setCancellationFee(settings.cancellationFee);
        }
      } catch (error) {
        console.error("⚠️ Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const subtotal =
    (socks * sockPrice || 0) +
    (cancellation ? cancellationFee * ticketCount : 0);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* 🧦 Socks Section */}
        <div className="addon-section">
          <div className="addon-header">
            <img src={Socks} alt="Socks" className="addon-img" />
            <h2>Socks</h2>
          </div>
          <div className="socks-content">
            <ul>
              <li>Looking to add some hilarious socks?</li>
            </ul>
            <span>
              (They'll be delivered to the event venue on the day of the event.)
            </span>
            <span>Anti Slip Socks are Mandatory for all participants*</span>
            <span>No Entry Without Socks*</span>
          </div>

          <div className="counter-row">
            <div className="socks-counter-wrapper">
              <span>€{(socks * sockPrice).toFixed(2)}</span>
              <div className="counter">
                <button onClick={() => setSocks(Math.max(0, socks - 1))}>
                  −
                </button>
                <span>{socks}</span>
                <button onClick={() => setSocks(socks + 1)}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* ❌ Cancellation Section */}
        <div className="addon-section">
          <div className="addon-header">
            <h2 className="addon-header-text">Cancellation</h2>
          </div>
          <div className="cancelation-content">
            <ul>
              <li>
                <p>
                  The cancellation service allows you to receive a full refund
                  (100%) of your ticket amount. Cancellations can be made up to
                  24 hours before the event, with a €{cancellationFee} fee per
                  ticket. Contact cancel@Magajumpark.eu for refunds.
                </p>
              </li>
              <li>
                <p>
                  If you don't purchase the cancellation service, tickets are
                  non-refundable and non-modifiable.
                </p>
              </li>
            </ul>
          </div>

          <div className="cancellation-check">
            <p>
              €{(cancellation ? cancellationFee * ticketCount : 0).toFixed(2)}
            </p>
            <input
              type="checkbox"
              checked={cancellation}
              onChange={(e) => setCancellation(e.target.checked)}
            />
          </div>
        </div>

        {/* 💰 Subtotal + Buttons */}
        <div className="total-footer">
          <div className="subtotal">
            <h4>Subtotal:</h4>
            <h4>€{subtotal.toFixed(2)}</h4>
          </div>

          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn confirm"
              onClick={() =>
                onSubmit({
                  socksCount: socks,
                  cancellationEnabled: cancellation,
                  cancellationFee: cancellation
                    ? cancellationFee * ticketCount
                    : 0,
                  totalAddOnAmount: subtotal,
                })
              }
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnModal;
