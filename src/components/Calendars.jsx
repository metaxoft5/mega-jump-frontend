import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import axios from "axios";
import Heart from "../assets/heart.png";

const statusColors = {
  few: "#D1E942",
  full: "#00C2FF",
  veryfull: "#F53E3E",
};

const BASE_URL = "https://api.megajumpparktickets.eu";

export default function Calendars({ onAddSelection }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [tickets, setTickets] = useState(0);
  const [timeOptions, setTimeOptions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [bundels, setBundels] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const lastSent = useRef(null);

  const increment = () => setTickets((prev) => prev + 1);
  const decrement = () => setTickets((prev) => (prev > 0 ? prev - 1 : 1));

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/settings`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const eventData = Array.isArray(res.data) ? res.data[0] : res.data;
        setSettings(eventData);
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
  

  const selectedSlot = timeOptions.find(
    (slot) => slot.startTime === selectedTime
  );

  useEffect(() => {
    if (!selectedSlot || !settings) return;

    const { date, startTime, endTime } = selectedSlot;
    const timestamp = new Date(`${date}T${startTime}`).getTime();

    const ticketUnitPrice = settings.ticketPrice || 0;
    const baseAmount = tickets * ticketUnitPrice;

    const bundleDiscount = selectedBundle
      ? selectedBundle.price * (selectedBundle.discountPercent / 100)
      : 0;
    const bundleNetPrice = selectedBundle
      ? selectedBundle.price - bundleDiscount
      : 0;
    console.log(bundleNetPrice);
    const totalAmount = baseAmount + bundleNetPrice;

    const selection = {
      date,
      startTime,
      endTime,
      timestamp,
      tickets,
      amount: totalAmount, // single ticket price
      totalBaseAmount: baseAmount, // total of ticketCount * unitPrice
      bundelSelected: !!selectedBundle,
      selectedBundel: selectedBundle,
    };
    console.log(selection);

    const isSame =
      lastSent.current &&
      lastSent.current.timestamp === selection.timestamp &&
      lastSent.current.tickets === selection.tickets &&
      lastSent.current.bundelSelected === selection.bundelSelected;

    if (!isSame) {
      lastSent.current = selection;
      onAddSelection(selection);
    }
  }, [selectedSlot, tickets, settings, selectedBundle, onAddSelection]);

  return (
    <>
      <div className="venue-container">
        <div className="venue-tag">
          <img src={Heart} alt="heart" className="emoji" />
          <span className="venue-text">
            {settings?.locationName || "Venue"}
          </span>
        </div>
        <div className="dates">
          {settings?.startDate && settings?.endDate
            ? `${new Date(
                settings.startDate
              ).toLocaleDateString()} – ${new Date(
                settings.endDate
              ).toLocaleDateString()}`
            : "Loading dates..."}
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          minDate={
            settings?.startDate ? new Date(settings.startDate) : undefined
          }
          maxDate={settings?.endDate ? new Date(settings.endDate) : undefined}
        />
      </div>

      <div className="time-selector">
        <h2>
          {selectedSlot
            ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
            : "Select a Time Slot"}
        </h2>

        <div className="pill-container">
          {timeOptions.map((slot) => (
            <button
              key={slot.id}
              className={`pill-btn ${
                selectedTime === slot.startTime ? "active" : ""
              }`}
              style={{ backgroundColor: statusColors[slot.status] }}
              onClick={() => setSelectedTime(slot.startTime)}
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

        {/* <div className="legend">
          <span>
            <span className="dot" style={{ backgroundColor: "#D1E942" }}></span>{" "}
            <h5>Few booked</h5>
          </span>
          <span>
            <span className="dot" style={{ backgroundColor: "#F53E3E" }}></span>{" "}
            <h5>Full</h5>
          </span>
          <span>
            <span className="dot" style={{ backgroundColor: "#00C2FF" }}></span>{" "}
            <h5>Partial booked</h5>
          </span>
        </div> */}

        {selectedSlot && (
          <p className="selected-date">
            {`${new Date(selectedSlot.date).getDate()} ${new Date(
              selectedSlot.date
            ).toLocaleString("default", { month: "short" })} ${new Date(
              selectedSlot.date
            ).getFullYear()} – ${
              selectedSlot.startTime
                ? selectedSlot.startTime
                : "Please Select Slot To Continue"
            }`}
          </p>
        )}
      </div>

      <div className="ticket-counter-wrapper mega-ticket-wrapper">
        <div className="pill-big selected-pill">
          <div className="text">
            <h4 className="mega-ticket-text">Mega Ticket</h4>
          </div>
          <div className="counter-wrapper">
            <p className="mega-ticket-price">
              €{(tickets * (settings?.ticketPrice || 0)).toFixed(2)}
            </p>
            <div className="ticket-counter mega-ticket-counter">
              <button onClick={decrement} className="counter-btn">
                –
              </button>
              <span className="ticket-count">{tickets}</span>
              <button onClick={increment} className="counter-btn">
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      {selectedBundle && (
        <div className="pill-big">
          <div className="text">
            <h4> {selectedBundle.name}</h4>
          </div>
          <div className="bundle-price">
            <p> €{selectedBundle.price.toFixed(2)}</p>
          </div>
          {selectedBundle && (
            <button
              className="remove-bundle-btn"
              onClick={() => setSelectedBundle(null)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className="bundle-tickets">
        <h3>Bundle Tickets</h3>
        <div className="bundle-tickets-container pill-container">
          {bundels.map((bundle) => (
            <button
              key={bundle._id}
              className={`bundle-ticket-item ${
                selectedBundle?._id === bundle._id ? "active" : ""
              }`}
              onClick={() => setSelectedBundle(bundle)}
            >
              <h4>{bundle.name}</h4>
              <p>{bundle.description}</p>
              <p>€{bundle.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
