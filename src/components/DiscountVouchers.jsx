import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = "https://api.megajumpparktickets.eu";
const HEADERS = {
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
};

const apiClient = {
  get: (endpoint) => axios.get(`${BASE_URL}${endpoint}`, { headers: HEADERS }),
  post: (endpoint, data) => axios.post(`${BASE_URL}${endpoint}`, data, { headers: HEADERS }),
  put: (endpoint, data) => axios.put(`${BASE_URL}${endpoint}`, data, { headers: HEADERS }),
  delete: (endpoint) => axios.delete(`${BASE_URL}${endpoint}`, { headers: HEADERS }),
};

const DiscountVouchers = ({ isOpen, onClose }) => {
  const [vouchers, setVouchers] = useState([]);
  const [ticketsWithVouchers, setTicketsWithVouchers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('vouchers'); // 'vouchers' or 'tickets'

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumAmount: '',
    maximumDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableFor: 'all'
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const endpoint = activeFilter === 'all' ? '/api/discount-vouchers' : `/api/discount-vouchers?active=${activeFilter}`;
      const response = await apiClient.get(endpoint);
      setVouchers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
      alert('Failed to fetch vouchers: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketsWithVouchers = async () => {
    try {
      setTicketsLoading(true);
      const response = await apiClient.get('/api/tickets');
      const allTickets = response.data.data || response.data || [];
      // Filter tickets that have voucherData
      const ticketsWithVouchers = allTickets.filter(ticket => ticket.voucherData && Object.keys(ticket.voucherData).length > 0);
      setTicketsWithVouchers(ticketsWithVouchers);
    } catch (error) {
      console.error('Failed to fetch tickets with vouchers:', error);
      alert('Failed to fetch tickets with vouchers: ' + (error.response?.data?.message || error.message));
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVouchers();
      fetchTicketsWithVouchers();
    }
  }, [isOpen, activeFilter]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumAmount: '',
      maximumDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      applicableFor: 'all'
    });
    setEditingVoucher(null);
  };

  const openModal = (voucher = null) => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        name: voucher.name,
        description: voucher.description || '',
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minimumAmount: voucher.minimumAmount || '',
        maximumDiscount: voucher.maximumDiscount || '',
        usageLimit: voucher.usageLimit === -1 ? '' : voucher.usageLimit,
        validFrom: voucher.validFrom ? new Date(voucher.validFrom).toISOString().split('T')[0] : '',
        validUntil: voucher.validUntil ? new Date(voucher.validUntil).toISOString().split('T')[0] : '',
        isActive: voucher.isActive,
        applicableFor: voucher.applicableFor
      });
      setEditingVoucher(voucher);
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumAmount: parseFloat(formData.minimumAmount) || 0,
        maximumDiscount: parseFloat(formData.maximumDiscount) || null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : -1,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil)
      };

      if (editingVoucher) {
        await apiClient.put(`/api/discount-vouchers/${editingVoucher._id}`, submitData);
        alert('✅ Voucher updated successfully!');
      } else {
        await apiClient.post('/api/discount-vouchers', submitData);
        alert('✅ Voucher created successfully!');
      }
      
      closeModal();
      fetchVouchers();
    } catch (error) {
      console.error('Failed to save voucher:', error);
      alert('Failed to save voucher: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (voucherId) => {
    const confirmed = window.confirm('Are you sure you want to delete this voucher?');
    if (!confirmed) return;

    try {
      await apiClient.delete(`/api/discount-vouchers/${voucherId}`);
      alert('✅ Voucher deleted successfully!');
      fetchVouchers();
    } catch (error) {
      console.error('Failed to delete voucher:', error);
      alert('Failed to delete voucher: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTicketDate = (dateStr, startTime, endTime) => {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    return `${date} ${startTime} - ${endTime}`;
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const isActive = (voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validUntil = new Date(voucher.validUntil);
    return voucher.isActive && now >= validFrom && now <= validUntil;
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="modal-box" style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🎫 Discount Vouchers</h2>
          <button onClick={onClose} style={{ background: '#4caf50', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('vouchers')}
            style={{
              background: activeTab === 'vouchers' ? '#4CAF50' : '#f0f0f0',
              color: activeTab === 'vouchers' ? 'white' : '#333',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🎫 Vouchers ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              background: activeTab === 'tickets' ? '#4CAF50' : '#f0f0f0',
              color: activeTab === 'tickets' ? 'white' : '#333',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🎟️ Tickets with Vouchers ({ticketsWithVouchers.length})
          </button>
        </div>

        {/* Vouchers Tab Content */}
        {activeTab === 'vouchers' && (
          <>
            {/* Filter and Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <select 
                value={activeFilter} 
                onChange={(e) => setActiveFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="all">All Vouchers</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
              
              <button 
                onClick={() => openModal()}
                style={{ 
                  background: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '6px', 
                  cursor: 'pointer' 
                }}
              >
                + Add Voucher
              </button>
            </div>

        {/* Vouchers Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading vouchers...</div>
        ) : (
          <div className="ticket-table-wrapper">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Discount</th>
                  <th>Min Amount</th>
                  <th>Usage</th>
                  <th>Valid Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length > 0 ? (
                  vouchers.map((voucher) => (
                    <tr key={voucher._id}>
                      <td>
                        <strong>{voucher.code}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{voucher.applicableFor}</small>
                      </td>
                      <td>
                        <div>{voucher.name}</div>
                        {voucher.description && (
                          <small style={{ color: '#666' }}>{voucher.description}</small>
                        )}
                      </td>
                      <td>
                        <div>
                          {voucher.discountType === 'percentage' ? 
                            `${voucher.discountValue}%` : 
                            `€${voucher.discountValue}`
                          }
                        </div>
                        {voucher.maximumDiscount && (
                          <div>
                            <small style={{ color: '#666' }}>Max: €{voucher.maximumDiscount}</small>
                          </div>
                        )}
                      </td>
                      <td>
                        {voucher.minimumAmount > 0 ? `€${voucher.minimumAmount}` : 'No minimum'}
                      </td>
                      <td>
                        {voucher.usageLimit === -1 ? 
                          `${voucher.usedCount} / Unlimited` : 
                          `${voucher.usedCount} / ${voucher.usageLimit}`
                        }
                      </td>
                      <td>
                        <div>{formatDate(voucher.validFrom)}</div>
                        <div>to {formatDate(voucher.validUntil)}</div>
                      </td>
                      <td>
                        {isExpired(voucher.validUntil) ? (
                          <span className="badge danger">Expired</span>
                        ) : isActive(voucher) ? (
                          <span className="badge success">Active</span>
                        ) : (
                          <span className="badge" style={{ background: '#FF9800', color: 'white' }}>Inactive</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => openModal(voucher)}
                          style={{ 
                            background: '#2196F3', 
                            color: 'white', 
                            border: 'none', 
                            padding: '6px 12px', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(voucher._id)}
                          style={{ 
                            background: '#f44336', 
                            color: 'white', 
                            border: 'none', 
                            padding: '6px 12px', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>No vouchers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {/* Tickets Tab Content */}
        {activeTab === 'tickets' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>🎟️ Tickets with Applied Vouchers</h3>
                <p style={{ color: '#666', margin: '0' }}>
                  Showing tickets where voucher codes have been applied and discounts were given.
                </p>
              </div>
              
              <button 
                onClick={fetchTicketsWithVouchers}
                style={{ 
                  background: '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {/* Tickets Table */}
            {ticketsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading tickets...</div>
            ) : (
              <div className="ticket-table-wrapper">
                <table className="ticket-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Customer</th>
                      <th>Date & Time</th>
                      <th>Voucher Code</th>
                      <th>Original Amount</th>
                      <th>Discount Amount</th>
                      <th>Final Amount</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsWithVouchers.length > 0 ? (
                      ticketsWithVouchers.map((ticket) => (
                        <tr key={ticket._id}>
                          <td>
                            <strong>{ticket.ticketId}</strong>
                          </td>
                          <td>
                            <div>{ticket.name} {ticket.surname}</div>
                            <small style={{ color: '#666' }}>{ticket.email}</small>
                          </td>
                          <td>
                            {formatTicketDate(ticket.date, ticket.startTime, ticket.endTime)}
                          </td>
                          <td>
                            <span style={{ 
                              background: '#4CAF50', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {ticket.voucherData.code}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#666' }}>€{ticket.voucherData.originalAmount?.toFixed(2) || '0.00'}</span>
                          </td>
                          <td>
                            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                              -€{ticket.voucherData.discountAmount?.toFixed(2) || '0.00'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: '#2196F3' }}>
                              €{ticket.voucherData.finalAmount?.toFixed(2) || '0.00'}
                            </span>
                          </td>
                          <td>
                            {ticket.paymentMethod === 'card' ? (
                              <span style={{ 
                                background: '#2196F3', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                Card
                              </span>
                            ) : (
                              <span style={{ 
                                background: '#FF9800', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                Cash
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center" }}>No tickets with vouchers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="admin-modal-overlay" style={{ zIndex: 1001 }}>
            <div className="modal-box" style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{editingVoucher ? 'Edit Voucher' : 'Add New Voucher'}</h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label>Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  
                  <div>
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label>Discount Type *</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (€)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label>Discount Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label>Minimum Amount (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumAmount}
                      onChange={(e) => setFormData({...formData, minimumAmount: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  
                  <div>
                    <label>Maximum Discount (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maximumDiscount}
                      onChange={(e) => setFormData({...formData, maximumDiscount: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      placeholder="Leave empty for unlimited"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  
                  <div>
                    <label>Applicable For</label>
                    <select
                      value={formData.applicableFor}
                      onChange={(e) => setFormData({...formData, applicableFor: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="all">All Items</option>
                      <option value="tickets">Tickets Only</option>
                      <option value="bundles">Bundles Only</option>
                      <option value="socks">Socks Only</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label>Valid From *</label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  
                  <div>
                    <label>Valid Until *</label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    Active
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit">
                    {editingVoucher ? 'Update Voucher' : 'Create Voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountVouchers; 