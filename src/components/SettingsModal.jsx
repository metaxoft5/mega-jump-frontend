import React, { useState } from "react";
import axios from "axios";
import "../assets/style/adminPanel.css";

const SettingsModal = ({ data, onClose, onSaved }) => {
  const [form, setForm] = useState(
    data || {
      locationName: "",
      address: "",
      startDate: "",
      endDate: "",
      ticketPrice: 0,
      socksPrice: 0,
      cancellationFee: 0,
    }
  );

  const isEdit = Boolean(data);
  const BASE_URL = "https://api.megajumpparktickets.eu";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    try {
      const url = isEdit
        ? `${BASE_URL}/api/settings/${form._id}` // ✅ Use ID for update
        : `${BASE_URL}/api/settings`; // ✅ Use POST for new setting

      const method = isEdit ? "put" : "post";

      const response = await axios[method](url, form, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
      });

      console.log("✅ Settings saved:", response.data);
      onSaved(); // callback to refresh parent list or UI
    } catch (error) {
      console.error("❌ Failed to save settings:", error);
      alert("Error saving settings. Please try again.");
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="modal-box">
        <h2>{isEdit ? "Edit" : "Add"} Event Settings</h2>
        <div className="form-grid">
          <label>
            Location Name
            <input
              name="locationName"
              placeholder="e.g. Downtown Park"
              value={form.locationName}
              onChange={handleChange}
            />
          </label>

          <label>
            Address
            <input
              name="address"
              placeholder="e.g. 123 Main St"
              value={form.address}
              onChange={handleChange}
            />
          </label>

          <label>
            Start Date
            <input
              type="date"
              name="startDate"
              value={form.startDate.slice(0, 10)}
              onChange={handleChange}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              name="endDate"
              value={form.endDate.slice(0, 10)}
              onChange={handleChange}
            />
          </label>

          <label>
            Ticket Price (€)
            <input
              type="number"
              name="ticketPrice"
              value={form.ticketPrice}
              onChange={handleChange}
            />
          </label>

          <label>
            Socks Price (€)
            <input
              type="number"
              name="socksPrice"
              value={form.socksPrice}
              onChange={handleChange}
            />
          </label>

          <label>
            Cancellation Fee (€)
            <input
              type="number"
              name="cancellationFee"
              value={form.cancellationFee}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={submit}>{isEdit ? "Update" : "Add"}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
