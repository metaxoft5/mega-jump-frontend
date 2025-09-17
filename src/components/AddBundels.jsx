

import React, { useState } from "react";
import axios from "axios";
import "../assets/style/adminPanel.css";

const BASE_URL = "https://api.megajumpparktickets.eu";

const AddBundels = ({ data, onClose, onSaved }) => {
  const [form, setForm] = useState(
    data || {
      name: "",
      discountPercent: 0,
      price: 0,
      description: "",
      tickets: 0,
    }
  );

  const isEdit = Boolean(data);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    try {
      const url = isEdit
        ? `${BASE_URL}/api/ticketbundels/${form._id}`
        : `${BASE_URL}/api/ticketbundels`;
      const method = isEdit ? "put" : "post";

      const response = await axios[method](url, form, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
      });

      console.log("✅ Bundle saved:", response.data);
      onSaved();
    } catch (error) {
      console.error("❌ Failed to save bundle:", error);
      alert("Error saving bundle. Please try again.");
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="modal-box">
        <h2>{isEdit ? "Edit" : "Add"} Ticket Bundle</h2>
        <div className="form-grid">
          <label>
            Bundle Name
            <input
              name="name"
              placeholder="e.g. Family Pack"
              value={form.name}
              onChange={handleChange}
            />
          </label>

          <label>
            Discount Percent (%)
            <input
              type="number"
              name="discountPercent"
              value={form.discountPercent}
              onChange={handleChange}
            />
          </label>

          <label>
            Price (€)
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
            />
          </label>

          <label>
            Tickets
            <input
              type="number"
              name="tickets"
              value={form.tickets}
              onChange={handleChange}
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              placeholder="Describe this bundle..."
              value={form.description}
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

export default AddBundels;