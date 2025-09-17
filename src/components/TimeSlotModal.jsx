// src/components/TimeSlotModal.js
import React, { useState } from "react";
import axios from "axios";
import "../assets/style/adminPanel.css";

const BASE_URL = "https://api.megajumpparktickets.eu";
const HEADERS = {
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
};

const apiClient = {
  post: (endpoint, data) =>
    axios.post(`${BASE_URL}${endpoint}`, data, { headers: HEADERS }),
  put: (endpoint, data) =>
    axios.put(`${BASE_URL}${endpoint}`, data, { headers: HEADERS }),
};

const TimeSlotModal = ({ data, onClose, onSaved, setting }) => {
  const isEdit = !!data;
  console.log(data, setting);
  const [date, setDate] = useState(data?.date || "");
  const [startTime, setStartTime] = useState(data?.startTime || "");
  const [endTime, setEndTime] = useState(data?.endTime || "");
  const [maxTickets, setMaxTickets] = useState(data?.maxTickets || 30);

  const [bulkMode, setBulkMode] = useState("none");
  const [weekdaySlots, setWeekdaySlots] = useState(
    Array.from({ length: 4 }, () => ({
      startTime: "",
      endTime: "",
      maxTickets: 30,
    }))
  );
  const [weekendSlots, setWeekendSlots] = useState(
    Array.from({ length: 7 }, () => ({
      startTime: "",
      endTime: "",
      maxTickets: 30,
    }))
  );

  const handleBulkChange = (index, field, value, type) => {
    const updateSlots = (prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot));

    if (type === "weekday") {
      setWeekdaySlots(updateSlots(weekdaySlots));
    } else {
      setWeekendSlots(updateSlots(weekendSlots));
    }
  };

  const handleSubmit = async () => {
    try {
      const eventStartDate = setting[0]?.startDate;
      const eventEndDate = setting[0]?.endDate;

      if (!eventStartDate || !eventEndDate) {
        alert("❌ Missing event start or end date in settings.");
        return;
      }
      // ✅ Bulk create slots
      if (bulkMode === "weekday" || bulkMode === "weekend") {
        const slots = bulkMode === "weekday" ? weekdaySlots : weekendSlots;
        const validSlots = slots.filter((s) => s.startTime && s.endTime);

        if (validSlots.length === 0) {
          alert("Please fill at least one valid slot.");
          return;
        }

        const payload = {
          eventStartDate,
          eventEndDate,
          dayType: bulkMode,
          slots: validSlots,
        };

        await apiClient.post("/api/timeslots/bulk-create", payload);
        alert(`✅ Successfully created ${bulkMode} slots.`);
        onSaved();
        return;
      }

      // ✅ Individual slot create/updateS IS THE
      if (!date || !startTime || !endTime) {
        alert("Please fill all individual fields.");
        return;
      }

      const payload = { date, startTime, endTime, maxTickets };

      if (isEdit) {
        await apiClient.put(`/api/timeslots/${data._id}`, payload);
        alert("Slot updated.");
      } else {
        await apiClient.post("/api/timeslots", payload);
        alert("Slot created.");
      }

      onSaved();
    } catch (err) {
      alert("❌ Failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="modal-box">
        <h2>{isEdit ? "✏️ Edit Time Slot" : "➕ Add Time Slot"}</h2>

        {/* Toggle Mode */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button
            className={bulkMode === "none" ? "selected" : ""}
            onClick={() => setBulkMode("none")}
          >
            Individual
          </button>
          <button
            className={bulkMode === "weekday" ? "selected" : ""}
            onClick={() => setBulkMode("weekday")}
          >
            Weekday Bulk
          </button>
          <button
            className={bulkMode === "weekend" ? "selected" : ""}
            onClick={() => setBulkMode("weekend")}
          >
            Weekend Bulk
          </button>
        </div>

        {/* Weekday Bulk Form */}
        {bulkMode === "weekday" &&
          weekdaySlots.map((slot, i) => (
            <div key={i} className="slot-row">
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  handleBulkChange(i, "startTime", e.target.value, "weekday")
                }
              />
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  handleBulkChange(i, "endTime", e.target.value, "weekday")
                }
              />
              <input
                type="number"
                value={slot.maxTickets}
                min="1"
                onChange={(e) =>
                  handleBulkChange(i, "maxTickets", e.target.value, "weekday")
                }
              />
            </div>
          ))}

        {/* Weekend Bulk Form */}
        {bulkMode === "weekend" &&
          weekendSlots.map((slot, i) => (
            <div key={i} className="slot-row">
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  handleBulkChange(i, "startTime", e.target.value, "weekend")
                }
              />
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  handleBulkChange(i, "endTime", e.target.value, "weekend")
                }
              />
              <input
                type="number"
                value={slot.maxTickets}
                min="1"
                onChange={(e) =>
                  handleBulkChange(i, "maxTickets", e.target.value, "weekend")
                }
              />
            </div>
          ))}

        {/* Individual Mode */}
        {bulkMode === "none" && (
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <input
              type="number"
              min="1"
              value={maxTickets}
              onChange={(e) => setMaxTickets(Number(e.target.value))}
            />
          </>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="danger">
            Cancel
          </button>
          <button onClick={handleSubmit}>{isEdit ? "Update" : "Save"}</button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotModal;
