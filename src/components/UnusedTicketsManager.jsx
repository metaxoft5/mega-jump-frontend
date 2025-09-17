import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const BASE_URL = "https://api.megajumpparktickets.eu";
const HEADERS = {
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
};

const UnusedTicketsManager = () => {
  const { t } = useTranslation();
  const [unusedTickets, setUnusedTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUnusedTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${BASE_URL}/api/tickets/unused-today`, {
        headers: HEADERS,
      });

      if (response.data.success) {
        setUnusedTickets(response.data.data.tickets);
        setStats(response.data.data.stats);
      } else {
        setError(response.data.message || "Failed to fetch unused tickets");
      }
    } catch (err) {
      console.error("Error fetching unused tickets:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!adminCredentials.username || !adminCredentials.password) {
      setError("Please enter admin credentials");
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${BASE_URL}/api/tickets/bulk-delete-unused-today`,
        { adminCredentials },
        { headers: HEADERS }
      );

      if (response.data.success) {
        setSuccess(`Successfully deleted ${response.data.deletedCount} unused tickets`);
        setShowDeleteConfirm(false);
        setAdminCredentials({ username: "", password: "" });
        // Refresh the list
        await fetchUnusedTickets();
      } else {
        setError(response.data.message || "Failed to delete tickets");
      }
    } catch (err) {
      console.error("Error deleting unused tickets:", err);
      if (err.response?.status === 401) {
        setError("Invalid admin credentials");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchUnusedTickets();
  }, []);

  const formatCurrency = (amount) => `€${Number(amount || 0).toFixed(2)}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="unused-tickets-manager">
      <div className="section-header">
        <h2>🗑️ Unused Tickets Management</h2>
        <div className="header-actions">
          <button 
            className="btn-refresh" 
            onClick={fetchUnusedTickets}
            disabled={loading}
          >
            {loading ? "🔄 Loading..." : "🔄 Refresh"}
          </button>
          {unusedTickets.length > 0 && (
            <button 
              className="btn-danger" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
            >
              🗑️ Bulk Delete All ({unusedTickets.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎟️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalUnusedToday}</div>
              <div className="stat-label">Unused Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalTicketsCount}</div>
              <div className="stat-label">Total Tickets</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalHalfTimeTickets}</div>
              <div className="stat-label">Half-Time Tickets</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalBundleTickets}</div>
              <div className="stat-label">Bundle Tickets</div>
            </div>
          </div>
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(stats.totalRevenue)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      {/* Tickets Table */}
      <div className="tickets-table-container">
        <h3>📋 Unused Tickets for Today ({stats?.date || new Date().toISOString().split('T')[0]})</h3>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading unused tickets...</p>
          </div>
        ) : unusedTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <h4>No unused tickets for today!</h4>
            <p>All tickets have been used or are properly managed.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Time Slot</th>
                  <th>Tickets</th>
                  <th>Half-Time</th>
                  <th>Bundle</th>
                  <th>Revenue</th>
                  <th>Payment</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {unusedTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="ticket-id">{ticket.ticketId}</td>
                    <td className="customer">
                      {ticket.name} {ticket.surname}
                    </td>
                    <td className="email">{ticket.email}</td>
                    <td className="time-slot">
                      {ticket.startTime} - {ticket.endTime}
                    </td>
                    <td className="ticket-count">
                      {ticket.tickets || 0}
                    </td>
                    <td className="half-time">
                      {ticket.halfTimeTickets || 0}
                    </td>
                    <td className="bundle">
                      {ticket.selectedBundel ? (
                        <div className="bundle-info">
                          <div className="bundle-name">{ticket.selectedBundel.name}</div>
                          <div className="bundle-tickets">({ticket.selectedBundel.tickets || 0} tickets)</div>
                        </div>
                      ) : (
                        <span className="no-bundle">—</span>
                      )}
                    </td>
                    <td className="revenue">{formatCurrency(ticket.subtotal)}</td>
                    <td className="payment-method">
                      <span className={`payment-badge ${ticket.isCashPayment ? 'cash' : 'visa-card'}`}>
                        {ticket.isCashPayment ? '💰 Cash' : '💳 Card'}
                      </span>
                    </td>
                    <td className="created-at">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm-modal">
            <div className="modal-header">
              <h3>⚠️ Confirm Bulk Delete</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="warning-message">
                <div className="warning-icon">🚨</div>
                <div className="warning-text">
                  <h4>This action cannot be undone!</h4>
                  <p>You are about to delete <strong>{unusedTickets.length} unused tickets</strong> for today.</p>
                  <p>This will permanently remove:</p>
                  <ul>
                    <li><strong>{stats?.totalTicketsCount || 0}</strong> total tickets</li>
                    <li><strong>{stats?.totalHalfTimeTickets || 0}</strong> half-time tickets</li>
                    <li><strong>{stats?.totalBundleTickets || 0}</strong> bundle tickets</li>
                    <li><strong>{formatCurrency(stats?.totalRevenue || 0)}</strong> in revenue records</li>
                  </ul>
                </div>
              </div>

              <div className="admin-credentials">
                <h4>🔐 Admin Authentication Required</h4>
                <div className="credential-inputs">
                  <input
                    type="text"
                    placeholder="Admin Username"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="credential-input"
                  />
                  <input
                    type="password"
                    placeholder="Admin Password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="credential-input"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleBulkDelete}
                disabled={deleting || !adminCredentials.username || !adminCredentials.password}
              >
                {deleting ? "🗑️ Deleting..." : "🗑️ Delete All Tickets"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .unused-tickets-manager {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .section-header h2 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-refresh, .btn-danger {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-refresh {
          background: #4CAF50;
          color: white;
        }

        .btn-refresh:hover:not(:disabled) {
          background: #45a049;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #da190b;
        }

        .btn-refresh:disabled, .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card.revenue {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .alert {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .alert-error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }

        .alert-success {
          background: #e8f5e8;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .tickets-table-container h3 {
          margin-bottom: 16px;
          color: #333;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .tickets-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .tickets-table th {
          background: #f8f9fa;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        .tickets-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }

        .tickets-table tr:hover {
          background: #f8f9fa;
        }

        .ticket-id {
          font-family: monospace;
          font-weight: 600;
          color: #4CAF50;
        }

        .customer {
          font-weight: 500;
        }

        .email {
          color: #666;
          font-size: 14px;
        }

        .time-slot {
          font-family: monospace;
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .ticket-count, .half-time {
          text-align: center;
          font-weight: 600;
          color: #4CAF50;
        }

        .bundle-info {
          font-size: 12px;
        }

        .bundle-name {
          font-weight: 600;
          color: #ff9800;
        }

        .bundle-tickets {
          color: #666;
        }

        .no-bundle {
          color: #ccc;
        }

        .revenue {
          font-weight: 600;
          color: #4CAF50;
          text-align: right;
        }

        .payment-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .payment-badge.cash {
          background: #fff3e0;
          color: #f57c00;
        }

        .payment-badge.visa-card {
          background: #e8f5e8;
          color: #4CAF50;
        }

        .created-at {
          color: #666;
          font-size: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .delete-confirm-modal {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h3 {
          margin: 0;
          color: #f44336;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 24px;
        }

        .warning-message {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #fff3e0;
          border-radius: 8px;
          border-left: 4px solid #ff9800;
        }

        .warning-icon {
          font-size: 32px;
        }

        .warning-text h4 {
          margin: 0 0 8px 0;
          color: #f57c00;
        }

        .warning-text p {
          margin: 8px 0;
          color: #333;
        }

        .warning-text ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .admin-credentials {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .admin-credentials h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .credential-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .credential-input {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .credential-input:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e0e0e0;
        }

        .btn-cancel {
          padding: 12px 24px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-cancel:hover {
          background: #f8f9fa;
        }

        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
          
          .section-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .header-actions {
            justify-content: center;
          }
          
          .tickets-table {
            font-size: 12px;
          }
          
          .tickets-table th,
          .tickets-table td {
            padding: 8px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default UnusedTicketsManager;
