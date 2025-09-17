// ✅ Fully Working and Updated AdminPanel.js
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import SettingsModal from "../components/SettingsModal";
import TimeSlotModal from "../components/TimeSlotModal";
import AddBundelsModal from "../components/AddBundels";
import DiscountVouchers from "../components/DiscountVouchers";
import UnusedTicketsManager from "../components/UnusedTicketsManager";
import "../assets/style/adminPanel.css";

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

const AdminPanel = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [settingsModal, setSettingsModal] = useState({ open: false, data: null });
  const [timeslotModal, setTimeSlotModal] = useState({ open: false, data: null });
  const [ticketPage, setTicketPage] = useState(1);
  const [cancelPage, setCancelPage] = useState(1);
  const [ticketSearch, setTicketSearch] = useState("");
  const [massCancelData, setMassCancelData] = useState({ date: '', slotId: '' });
  const [showPrompt, setShowPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteDate, setDeleteDate] = useState("");
  const [bundles, setBundles] = useState([]);
  const [bundelsModal, setBundelsModal] = useState({ open: false, data: null });
  const [analytics, setAnalytics] = useState(null);
  const [discountVouchersModal, setDiscountVouchersModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    massCancel: false,
    settings: false,
    timeSlots: false,
    bundles: false,
    tickets: false,
    analytics: false,
    cancelRequests: false,
    discountVouchers: false
  });

  const TICKETS_PER_PAGE = 10;
  const CANCELS_PER_PAGE = 10;

  const normalize = (res) => {
    if (!res?.data) return [];
    return Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
  };

  const fetchData = async () => {
    try {
      const [settingsRes, timeslotsRes, ticketsRes, cancelReqRes, ticketbundelsRes, analyticsRes] = await Promise.all([
        apiClient.get("/api/settings"),
        apiClient.get("/api/timeslots"),
        apiClient.get("/api/tickets"),
        apiClient.get("/api/cancel-request"),
        apiClient.get("/api/ticketbundels"),
        apiClient.get("/api/tickets/analytics"),
      ]);
      setSettings(normalize(settingsRes));
      setTimeSlots(normalize(timeslotsRes));
      setTickets(normalize(ticketsRes));
      setCancelRequests(normalize(cancelReqRes));
      setBundles(normalize(ticketbundelsRes));
      setAnalytics(analyticsRes.data?.data || null);
    } catch (err) {
      console.error("❌ Failed to fetch data:", err);
      setSettings([]);
      setTimeSlots([]);
      setTickets([]);
      setCancelRequests([]);
      setAnalytics(null);
    }
  };

  useEffect(() => {
     console.log('Analytics Data:', analytics);
  }, [analytics]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setTicketPage(1); }, [tickets]);
  useEffect(() => { setCancelPage(1); }, [cancelRequests]);

  // Comprehensive Ticket Analytics
  useEffect(() => {
    if (tickets.length > 0) {
      console.log('🎫 === TICKET ANALYTICS === 🎫');
      
      // Filter out tickets with pending payment status
      const confirmedTickets = tickets.filter(ticket => ticket.paymentStatus !== 'pending');
      const pendingTickets = tickets.filter(ticket => ticket.paymentStatus === 'pending');
      
      console.log('⚠️ Excluded from analytics:', pendingTickets.length, 'tickets with pending payment status');
      
      // Calculate total tickets (including bundles and half-time tickets) - only confirmed payments
      const totalTickets = confirmedTickets.reduce((total, ticket) => {
        let ticketCount = 0;
        
        // Regular tickets
        if (ticket.tickets && ticket.tickets > 0) {
          ticketCount += ticket.tickets;
        }
        
        // Bundle tickets
        if (ticket.selectedBundel && ticket.selectedBundel.tickets) {
          ticketCount += ticket.selectedBundel.tickets;
        }
        
        // Half-time tickets
        if (ticket.halfTimeTickets && ticket.halfTimeTickets > 0) {
          ticketCount += ticket.halfTimeTickets;
        }
        
        return total + ticketCount;
      }, 0);
      
      console.log('📊 Total Tickets Sold:', totalTickets);
      
      // Calculate total revenue
      const totalRevenue = confirmedTickets.reduce((total, ticket) => {
        return total + (ticket.subtotal || 0);
      }, 0);
      
      console.log('💰 Total Revenue Generated: €' + totalRevenue.toFixed(2));
      
      // Calculate total number of sales
      const totalSales = confirmedTickets.length;
      console.log('🛒 Total Number of Sales:', totalSales);
      
      // Get current date and previous date
      const currentDate = '2025-08-18';
      const previousDate = '2025-08-17';
      
      // Calculate today's sales
      const todaySales = confirmedTickets.filter(ticket => ticket.date === currentDate);
      const todayTickets = todaySales.reduce((total, ticket) => {
        let ticketCount = 0;
        if (ticket.tickets && ticket.tickets > 0) ticketCount += ticket.tickets;
        if (ticket.selectedBundel && ticket.selectedBundel.tickets) ticketCount += ticket.selectedBundel.tickets;
        if (ticket.halfTimeTickets && ticket.halfTimeTickets > 0) ticketCount += ticket.halfTimeTickets;
        return total + ticketCount;
      }, 0);
      const todayRevenue = todaySales.reduce((total, ticket) => total + (ticket.subtotal || 0), 0);
      
      console.log('📅 Today (' + currentDate + ') Sales:');
      console.log('   - Number of Sales:', todaySales.length);
      console.log('   - Total Tickets:', todayTickets);
      console.log('   - Total Revenue: €' + todayRevenue.toFixed(2));
      
      // Calculate previous day's sales
      const previousDaySales = confirmedTickets.filter(ticket => ticket.date === previousDate);
      const previousDayTickets = previousDaySales.reduce((total, ticket) => {
        let ticketCount = 0;
        if (ticket.tickets && ticket.tickets > 0) ticketCount += ticket.tickets;
        if (ticket.selectedBundel && ticket.selectedBundel.tickets) ticketCount += ticket.selectedBundel.tickets;
        if (ticket.halfTimeTickets && ticket.halfTimeTickets > 0) ticketCount += ticket.halfTimeTickets;
        return total + ticketCount;
      }, 0);
      const previousDayRevenue = previousDaySales.reduce((total, ticket) => total + (ticket.subtotal || 0), 0);
      
      console.log('📅 Previous Day (' + previousDate + ') Sales:');
      console.log('   - Number of Sales:', previousDaySales.length);
      console.log('   - Total Tickets:', previousDayTickets);
      console.log('   - Total Revenue: €' + previousDayRevenue.toFixed(2));
      
      // Calculate total socks sales
      const totalSocks = confirmedTickets.reduce((total, ticket) => {
        return total + (ticket.socksCount || 0);
      }, 0);
      
      console.log('🧦 Total Socks Sold:', totalSocks);
      
      // Calculate half-time tickets separately
      const totalHalfTimeTickets = confirmedTickets.reduce((total, ticket) => {
        return total + (ticket.halfTimeTickets || 0);
      }, 0);
      
      console.log('⏰ Total Half-Time Tickets Sold:', totalHalfTimeTickets);
      
      // Calculate bundle sales count
      const bundleSales = confirmedTickets.filter(ticket => ticket.selectedBundel && ticket.selectedBundel.tickets > 0).length;
      console.log('📦 Total Bundle Sales:', bundleSales);
      
      // Detailed breakdown by ticket type
      let regularTickets = 0;
      let bundleTickets = 0;
      
      confirmedTickets.forEach(ticket => {
        if (ticket.tickets && ticket.tickets > 0) {
          regularTickets += ticket.tickets;
        }
        if (ticket.selectedBundel && ticket.selectedBundel.tickets) {
          bundleTickets += ticket.selectedBundel.tickets;
        }
      });
      
      console.log('🎟️ Ticket Type Breakdown:');
      console.log('   - Regular Tickets:', regularTickets);
      console.log('   - Bundle Tickets:', bundleTickets);
      console.log('   - Half-Time Tickets:', totalHalfTimeTickets);
      console.log('   - Total:', regularTickets + bundleTickets + totalHalfTimeTickets);
      
      // Payment method breakdown
      const cashPayments = confirmedTickets.filter(ticket => ticket.paymentMethod === 'cash').length;
      const cardPayments = confirmedTickets.filter(ticket => ticket.paymentMethod === 'card').length;
      
      console.log('💳 Payment Method Breakdown:');
      console.log('   - Cash Payments:', cashPayments);
      console.log('   - Card Payments:', cardPayments);
      
      // Revenue by payment method
      const cashRevenue = confirmedTickets
        .filter(ticket => ticket.paymentMethod === 'cash')
        .reduce((total, ticket) => total + (ticket.subtotal || 0), 0);
      
      const cardRevenue = confirmedTickets
        .filter(ticket => ticket.paymentMethod === 'card')
        .reduce((total, ticket) => total + (ticket.subtotal || 0), 0);
      
      console.log('💰 Revenue by Payment Method:');
      console.log('   - Cash Revenue: €' + cashRevenue.toFixed(2));
      console.log('   - Card Revenue: €' + cardRevenue.toFixed(2));
      
      console.log('🎫 === END TICKET ANALYTICS === 🎫');
    }
  }, [tickets]);

  const filteredTickets = tickets.filter(ticket => {
    const search = ticketSearch.toLowerCase();
    return (
      ticket.ticketId?.toLowerCase().includes(search) ||
      ticket.name?.toLowerCase().includes(search) ||
      ticket.surname?.toLowerCase().includes(search) ||
      ticket.email?.toLowerCase().includes(search)
    );
  });

  const paginatedTickets = filteredTickets.slice((ticketPage - 1) * TICKETS_PER_PAGE, ticketPage * TICKETS_PER_PAGE);
  const paginatedCancelRequests = cancelRequests.slice((cancelPage - 1) * CANCELS_PER_PAGE, cancelPage * CANCELS_PER_PAGE);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleDeleteByDate = async () => {
    if (!deleteDate) return alert(t('admin.selectDateFirst'));
    const confirmed = window.confirm(`Delete all slots for ${deleteDate}?`);
    if (!confirmed) return;
  
    try {
      const res = await axios.delete(`${BASE_URL}/api/timeslots/date/${deleteDate}`, {
        headers: HEADERS,
      });
      alert(`✅ Deleted ${res.data.deletedCount} slots for ${deleteDate}`);
    } catch (err) {
      alert("❌ Failed to delete slots: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(t('admin.deleteAllSlotsConfirm'));
    if (!confirmed) return;
  
    try {
      const res = await axios.delete(`${BASE_URL}/api/timeslots/all`, {
        headers: HEADERS,
      });
      alert(`✅ Deleted ${res.data.deletedCount} slots`);
    } catch (err) {
      alert("❌ Failed to delete all slots: " + (err.response?.data?.error || err.message));
    }
  };

  const cancelAndRefundTicket = async (ticketId) => {
    try {
      console.log(`🔁 Cancelling and refunding ticket: ${ticketId}`);
      const confirmed = window.confirm("Are you sure you want to cancel and refund this ticket?");
      if (!confirmed) return;
  
      const response = await apiClient.post(`/api/refund/cancel-refund/${ticketId}`);
      console.log("✅ Ticket successfully refunded:", response.data);
      alert("✅ Ticket cancelled and refunded.");
      fetchData();
    } catch (err) {
      console.error("❌ Refund failed:", err);
      alert("❌ Refund failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTicket = async (ticket) => {
    try {
      const identifier = ticket?._id || ticket?.ticketId;
      if (!identifier) {
        alert('⚠️ Invalid ticket identifier');
        return;
      }
      const ok = window.confirm(`🗑️ Delete ticket ${ticket.ticketId || identifier}? This cannot be undone.`);
      if (!ok) return;

      const res = await apiClient.delete(`/api/tickets/${identifier}`);
      alert(res?.data?.message || '✅ Ticket deleted successfully');
      await fetchData();
    } catch (err) {
      alert('❌ Failed to delete ticket: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredSlots = timeSlots.filter(slot => slot.date === massCancelData.date);

  const handleMassCancelRefund = async () => {
    try {
      const { date, slotId } = massCancelData;
      const slot = timeSlots.find(s => s._id === slotId);
      if (!date || !slotId || !slot) return alert(t('admin.selectValidDateSlot'));
      const res = await apiClient.post("/api/refund/mass-cancel-refund", {
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      alert(`✅ Refunded: ${res.data.refunded.length}, ❌ Failed: ${res.data.failed.length}\nTotal Processed: ${res.data.totalTicketsProcessed}`);

      fetchData();
    } catch (err) {
      alert("Mass refund failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    if (!email || !password) {
      alert("⚠️ Please enter both email and password.");
      return;
    }

    try {
      setDeleting(true);
      const response = await axios.delete(
        `${BASE_URL}/api/tickets/delete-all-with-auth`,
        {
          headers: HEADERS,
          data: { email, password },
        }
      );
      alert(response.data.message);
      setShowPrompt(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminRole");
    sessionStorage.removeItem("adminUsername");
    window.location.href = "/admin/login";
  };

  return (
    <div className="admin-dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className="admin-title">{t('admin.dashboard')}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#666" }}>{t('common.welcome')}, {sessionStorage.getItem("adminUsername")}</span>
          <button 
            onClick={handleLogout}
            style={{ 
              background: "#f44336", 
              color: "white", 
              border: "none", 
              padding: "8px 16px", 
              borderRadius: "4px", 
              cursor: "pointer" 
            }}
          >
            {t('common.logout')}
          </button>
        </div>
      </div>
      
      {/* Mass Cancel & Refund */}
      <div style={{ background: "#ffe", padding: 16, border: "1px solid #ddd", borderRadius: 8, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleSection('massCancel')}>
          <h3 style={{ margin: 0 }}>{t('admin.massCancellation')}</h3>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.massCancel ? '▼' : '▲'}</span>
        </div>
        {!collapsedSections.massCancel && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
            <input
              type="date"
              value={massCancelData.date}
              onChange={(e) =>
                setMassCancelData((prev) => ({ ...prev, date: e.target.value, slotId: "" }))
              }
            />
            <select
              value={massCancelData.slotId}
              onChange={(e) =>
                setMassCancelData((prev) => ({ ...prev, slotId: e.target.value }))
              }
              disabled={!massCancelData.date || filteredSlots.length === 0}
            >
              <option value="">{t('admin.selectTimeSlot')}</option>
              {filteredSlots.map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {slot.startTime} - {slot.endTime}
                </option>
              ))}
            </select>
            <button onClick={handleMassCancelRefund}>{t('admin.massCancelRefund')}</button>
          </div>
        )}
      </div>

      {/* Event Settings */}
      <div className="dashboard-section">
        <div className="section-header" style={{ cursor: "pointer" }} onClick={() => toggleSection('settings')}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h2>{t('admin.eventSettings')}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             {settings.length === 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsModal({ open: true, data: null });
                }}
                disabled={settings.length >= 1}
                title={t('admin.onlyOneSettingAllowed')}
                style={{
                  opacity: settings.length >= 1 ? 0.5 : 1,
                  cursor: settings.length >= 1 ? "not-allowed" : "pointer",
                }}
              >
                {t('admin.addEditSetting')}
              </button>
 )  }
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.settings ? '▼' : '▲'}</span>
            </div>
          </div>
        </div>

        {!collapsedSections.settings && (
          <div className="data-grid">
            {settings.map((s) => (
              <div key={s._id} className="data-card">
                <p><strong>{s.locationName}</strong></p>
                <p>{s.address}</p>
                <p>{formatDate(s.startDate)} → {formatDate(s.endDate)}</p>
                <p>🎟️ {t('admin.ticketPrice')}:€{s.ticketPrice} | 🧦 {t('admin.socksPrice')}: €{s.socksPrice} | ❌ {t('admin.cancellationFee')}: €{s.cancellationFee}</p>
                <button onClick={() => setSettingsModal({ open: true, data: s })}>{t('common.edit')}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Slots */}
      <div className="dashboard-section">
        <div className="section-header" style={{display:'flex',gap:20,alignItems:'center', flexWrap:'wrap', cursor: "pointer" }} onClick={() => toggleSection('timeSlots')}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h2>{t('admin.timeSlots')}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.timeSlots ? '▼' : '▲'}</span>
            </div>
          </div>
        </div>

        {!collapsedSections.timeSlots && (
          <>
            <div className="timeslot-controls" style={{ display:'flex' ,gap:50,marginTop: 20, justifyContent:'flex-end', alignItems:'center', flexWrap:'wrap'}}>
              <input
                type="date"
                value={deleteDate}
                onChange={(e) => setDeleteDate(e.target.value)}
                style={{ padding: '6px 10px', height: '45px', width: '190px', borderRadius: '8px'}}
              />
              <button
                onClick={handleDeleteByDate}
                style={{ backgroundColor: 'crimson', color: 'white',   borderRadius: 8 }}
              >
                 {t('admin.deleteSlotsForDate')}
              </button>
              <button
                onClick={handleDeleteAll}
                style={{ backgroundColor: 'black', color: 'white',   borderRadius: 8 }}
              >
                 {t('admin.deleteAllSlots')}
              </button>
              <button
                onClick={() => setTimeSlotModal({ open: true, data: null })}
                disabled={settings.length === 0}
                title={settings.length === 0 ? t('admin.addEventSettingFirst') : ""}
                style={{
                  opacity: settings.length === 0 ? 0.5 : 1,
                  cursor: settings.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {t('admin.addTimeSlot')}
              </button>
            </div>

            <div className="data-grid scrollable-grid">
              {timeSlots
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((ts) => {
                const slotDate = new Date(ts.date);
                const isWeekend = slotDate.getDay() === 0 || slotDate.getDay() === 6;
                
                return (
                  <div 
                    key={ts._id} 
                    className="data-card"
                    style={{
                      backgroundColor: isWeekend ? '#f9ffc7' : 'inherit'
                    }}
                  >
                    <p><strong>{formatDate(ts.date)}</strong></p>
                    <p>{ts.startTime} – {ts.endTime}</p>
                    <p>{t('admin.maxTickets')}: {ts.maxTickets}</p>
                    <p>Total Booked: {ts.totalBooked || 0}</p>
                    <p>Available: {ts.availableTickets || 0}</p>
                    <p>Status: {ts.isFullyBooked ? 'Fully Booked' : 'Available'}</p>
                    <div className="card-actions">
                      <button onClick={() => setTimeSlotModal({ open: true, data: ts })}>{t('common.edit')}</button>
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.delete(`/api/timeslots/${ts._id}`);
                            alert(`✅ Time slot deleted successfully!\nDate: ${formatDate(ts.date)}\nTime: ${ts.startTime} - ${ts.endTime}`);
                            fetchData();
                          } catch (error) {
                            alert(`❌ Failed to delete time slot: ${error.response?.data?.message || error.message}`);
                          }
                        }}
                        className="danger"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bundles Section */}
      <div className="dashboard-section">
        <div className="section-header" style={{ cursor: "pointer" }} onClick={() => toggleSection('bundles')}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h2>{t('admin.bundles')}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBundelsModal({ open: true, data: null });
                }}
              >
                {t('admin.addBundle')}
              </button>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.bundles ? '▼' : '▲'}</span>
            </div>
          </div>
        </div>
        {!collapsedSections.bundles && (
          <div className="ticket-table-wrapper">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>{t('admin.bundleName')}</th>
                  <th>{t('admin.discountPercent')}</th>
                  <th>Price (€)</th>
                  <th>{t('admin.tickets')}</th>
                  <th>{t('admin.description')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {bundles.length > 0 ? (
                  bundles.map((bundle) => (
                    <tr key={bundle._id}>
                      <td>{bundle.name}</td>
                      <td>{bundle.discountPercent}%</td>
                      <td>€{bundle.price}</td>
                      <td>{bundle.tickets}</td>
                      <td>{bundle.description}</td>
                      <td>
                        <button onClick={() => setBundelsModal({ open: true, data: bundle })}>{t('common.edit')}</button>
                        <button
                        style={{  color: 'white', borderRadius: 8, padding: '11px 20px', marginLeft: 20 }}
                          className="danger"
                          onClick={async () => {
                            await apiClient.delete(`/api/ticketbundels/${bundle._id}`);
                            fetchData();
                          }}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>{t('admin.noBundlesFound')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discount Vouchers Section */}
      <div className="dashboard-section">
        <div className="section-header" style={{ cursor: "pointer" }} onClick={() => toggleSection('discountVouchers')}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h2>{t('admin.discountVouchers')}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDiscountVouchersModal(true);
                }}
              >
                {t('admin.manageVouchers')}
              </button>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.discountVouchers ? '▼' : '▲'}</span>
            </div>
          </div>
        </div>
        {!collapsedSections.discountVouchers && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
              {t('admin.manageDiscountVouchers')}
            </p>
            <button
              onClick={() => setDiscountVouchersModal(true)}
              style={{ 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
            >
              {t('admin.openVoucherManager')}
            </button>
          </div>
        )}
      </div>
     
      {/* Tickets */}
      <div className="dashboard-section">
        <div className="section-header" style={{ cursor: "pointer" }} onClick={() => toggleSection('tickets')}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h2>{t('admin.tickets')}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.tickets ? '▼' : '▲'}</span>
            </div>
          </div>
        </div>
        {!collapsedSections.tickets && (
          <>
            <div style={{ marginBottom: 18, display: 'flex', gap: 50, justifyContent: 'flex-end' }}>
              <button
                className="danger"
                onClick={() => setShowPrompt(true)}
                style={{ marginTop: "16px", background: "crimson", color: "white" }}
              >
                 {t('admin.deleteAllTickets')}
              </button>
              <input
                type="text"
                placeholder={t('admin.searchByTicketId')}
                value={ticketSearch}
                onChange={e => { setTicketSearch(e.target.value); setTicketPage(1); }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #b3c6e0',
                  fontSize: 15,
                  width: 260,
                  outline: 'none',
                  boxShadow: '0 1px 4px rgba(15,82,186,0.04)'
                }}
              />
            </div>
            <div className="ticket-table-wrapper">
              <table className="ticket-table">
                                 <thead>
                   <tr>
                     <th>{t('admin.ticketId')}</th>
                     <th>{t('admin.name')}</th>
                     <th>{t('admin.email')}</th>
                     <th>{t('admin.date')}</th>
                     <th>{t('admin.time')}</th>
                     <th>{t('admin.quantity')}</th>
                     <th>{t('admin.price')}</th>
                     <th>Payment Status</th>
                     <th>Payment Method</th>
                     <th>Socks Count</th>
                     <th>{t('admin.usedUnused')}</th>
                     <th>{t('admin.status')}</th>
                     <th>{t('admin.action')}</th>
                   </tr>
                 </thead>
                <tbody>
                  {paginatedTickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>{ticket.ticketId}</td>
                      <td>{ticket.name} {ticket.surname}</td>
                      <td>{ticket.email}</td>
                      <td>{ticket.date}</td>
                      <td>{ticket.startTime} - {ticket.endTime}</td>



                      
                        {ticket.tickets < 1 && ticket.selectedBundel?.tickets > 0 && (
                          <td>B-ticket : {ticket.selectedBundel?.tickets}</td>
                        )}
                        {ticket.tickets > 0 && !ticket.selectedBundel?.tickets && (
                          <td>ticket : {ticket.tickets}</td>
                        )}
                         {ticket.tickets > 0  && ticket.selectedBundel?.tickets && (
                          <td>{ticket.tickets} + B-ticket : {ticket.selectedBundel?.tickets}</td>
                        )}
                        {ticket.tickets < 1 && !ticket.selectedBundel?.tickets && ticket.halfTimeTickets > 0 &&  (
                          <td> Half time:  {ticket.halfTimeTickets}</td>
                        )}
                        {ticket.tickets > 0 && !ticket.selectedBundel?.tickets && ticket.halfTimeTickets > 0 &&  (
                          <td>ticket : {ticket.tickets} + Half time:  {ticket.halfTimeTickets}</td>
                        )}
                        {ticket.tickets > 0  && ticket.selectedBundel?.tickets && ticket.halfTimeTickets > 0 && (
                          <td>Ticket : {ticket.tickets} + B-ticket : {ticket.selectedBundel?.tickets} + Half time:  {ticket.halfTimeTickets}</td>
                        )}
                        
                      
                      
                                             {/* <td>{ticket.tickets === 0 ? "B-ticket : "+ ticket.selectedBundel?.tickets : ticket?.tickets}</td> */}
                       <td>€{ticket.subtotal}</td>
                       <td>
                         {ticket.paymentStatus === 'paid' ? (
                           <span className="badge success">Paid</span>
                         ) : ticket.paymentStatus === 'pending' ? (
                           <span className="badge warning">Pending</span>
                         ) : ticket.paymentStatus === 'failed' ? (
                           <span className="badge danger">Failed</span>
                         ) : (
                           <span className="badge">Unknown</span>
                         )}
                       </td>
                       <td>
                         {ticket.paymentMethod === 'card' ? (
                           <span className="badge" style={{ backgroundColor: '#2196F3', color: 'white' }}>Card</span>
                         ) : ticket.paymentMethod === 'cash' ? (
                           <span className="badge" style={{ backgroundColor: '#FF9800', color: 'white' }}>Cash</span>
                         ) : (
                           <span className="badge">N/A</span>
                         )}
                       </td>
                       <td>{ticket.socksCount || 0}</td>
                       <td>
                         {ticket.isUsed ? (
                           <span className="badge danger">{t('admin.used')}</span>
                         ) : (
                           <span className="badge success">{t('admin.unused')}</span>
                         )}
                       </td>
                      <td>
                        {ticket.cancelTicket ? (
                          <span className="badge danger">{t('admin.cancelled')}</span>
                        ) : (
                          <span className="badge success">{t('admin.active')}</span>
                        )}
                      </td>
                      <td>
                        {
                          (ticket.cancellationEnabled || ticket.addonData?.cancellationEnabled && ticket.metadata?.stripePaymentIntentId ) ? (
                            <button
                              className="danger"
                              onClick={() => cancelAndRefundTicket(ticket.ticketId)}
                              disabled={ticket.refundStatus === 'refunded'}
                            >
                              {t('admin.cancelRefund')}
                            </button>
                          ) : (
                            <span style={{ opacity: 0.5 }}>{t('admin.notApplicable')}</span>
                          )
                        }
                        <button
                          className="danger"
                          onClick={() => handleDeleteTicket(ticket)}
                          style={{ marginLeft: 12 }}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                                     {paginatedTickets.length === 0 && (
                     <tr>
                       <td colSpan="12" style={{ textAlign: "center" }}>{t('admin.noTicketsFound')}</td>
                     </tr>
                   )}
                </tbody>
              </table>
              {filteredTickets.length > TICKETS_PER_PAGE && (
                <div className="pagination-controls">
                  <button onClick={() => setTicketPage(ticketPage - 1)} disabled={ticketPage === 1}>{t('admin.prev')}</button>
                  <span>{t('admin.page')} {ticketPage} {t('admin.of')} {Math.ceil(filteredTickets.length / TICKETS_PER_PAGE)}</span>
                  <button onClick={() => setTicketPage(ticketPage + 1)} disabled={ticketPage === Math.ceil(filteredTickets.length / TICKETS_PER_PAGE)}>{t('admin.next')}</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
{/* Unused Tickets Management */}
<UnusedTicketsManager />
      {/* Analytics Section */}
      {analytics && (
        <div className="dashboard-section">
          <div className="section-header" style={{ cursor: "pointer" }} onClick={() => toggleSection('analytics')}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <h2>{t('admin.analytics')}</h2>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.analytics ? '▼' : '▲'}</span>
            </div>
          </div>
          {!collapsedSections.analytics && (
            <>
              {/* Key Metrics Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{t('admin.totalRevenue')}</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>€{analytics.totalRevenue?.toFixed(2) || '0.00'}</p>
                </div>
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Total Sales</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{analytics.totalSales || 0}</p>
                </div>
                
            
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{t('admin.totalTickets')}</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{analytics.totalTickets || 0}</p>
                </div>
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Half-Time Tickets</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{analytics.totalHalfTimeTickets || 0}</p>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Total Socks</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{analytics.totalSocks || 0}</p>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Cash Revenue</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>€{analytics.totalCashRevenue?.toFixed(2) || '0.00'}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: '0.9' }}>{analytics.cashPayments || 0} transactions</p>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Card Revenue</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>€{analytics.totalCardRevenue?.toFixed(2) || '0.00'}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: '0.9' }}>{analytics.cardPayments || 0} transactions</p>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Bundle Sales</h3>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{analytics.bundleSales || 0}</p>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                
                {/* Payment Methods */}
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>💳 Payment Methods</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Cash Payments:</span>
                    <span style={{ fontWeight: 'bold' }}>{analytics.cashPayments || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Card Payments:</span>
                    <span style={{ fontWeight: 'bold' }}>{analytics.cardPayments || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    <span>Total Transactions:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{(analytics.cashPayments || 0) + (analytics.cardPayments || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Cash Revenue:</span>
                    <span style={{ fontWeight: 'bold', color: '#FF9800' }}>€{analytics.totalCashRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Card Revenue:</span>
                    <span style={{ fontWeight: 'bold', color: '#2196F3' }}>€{analytics.totalCardRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    <span>Total Revenue:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>€{((analytics.totalCashRevenue || 0) + (analytics.totalCardRevenue || 0)).toFixed(2)}</span>
                  </div>
                </div>

                {/* Sales Analytics */}
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Sales Analytics</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Revenue:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>€{analytics.totalRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Sales:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{analytics.totalSales || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Tickets:</span>
                    <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{analytics.totalTickets || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Bundle Sales:</span>
                    <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{analytics.bundleSales || 0}</span>
                  </div>
                </div>

                {/* Ticket Usage */}
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🎫 Ticket Usage</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Used Tickets:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{analytics.usedTickets || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Unused Tickets:</span>
                    <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{analytics.unusedTickets || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Tickets:</span>
                    <span style={{ fontWeight: 'bold' }}>{analytics.totalTickets || 0}</span>
                  </div>
                </div>

                {/* Refunds */}
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔄 Refunds</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Refunds:</span>
                    <span style={{ fontWeight: 'bold', color: '#f44336' }}>{analytics.totalRefunds || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Refunded Amount:</span>
                    <span style={{ fontWeight: 'bold', color: '#f44336' }}>€{analytics.refundedAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>💳 Payment Method Breakdown</h3>
                  {analytics.paymentMethodBreakdown && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Cash Payments:</span>
                        <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{analytics.paymentMethodBreakdown.cash || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Card Payments:</span>
                        <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{analytics.paymentMethodBreakdown.card || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                        <span>Total Transactions:</span>
                        <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{analytics.paymentMethodBreakdown.total || 0}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📈 Period Overview</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Period:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{analytics.period || 'All Time'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Revenue:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>€{analytics.totalRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Sales:</span>
                    <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{analytics.totalSales || 0}</span>
                  </div>
                </div>
              </div>

              {/* Bundle Breakdown */}
              {analytics.bundleBreakdownArray && analytics.bundleBreakdownArray.length > 0 && (
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  marginBottom: '30px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📦 Bundle Sales Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {analytics.bundleBreakdownArray.map((bundle, index) => (
                      <div key={index} style={{ 
                        background: '#f8f9fa', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{bundle.name}</div>
                        <div style={{ color: '#666' }}>Sold: {bundle.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Average Metrics */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Average Metrics</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Average Ticket Price:</span>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>€{analytics.averageTicketPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Average Sale Value:</span>
                    <span style={{ fontWeight: 'bold', color: '#FF9800' }}>€{analytics.averageSaleValue?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🎯 Top Selling Date</h3>
                  {analytics.topSellingDates && analytics.topSellingDates.length > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Date:</span>
                        <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{analytics.topSellingDates[0]?.date}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Sales:</span>
                        <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{analytics.topSellingDates[0]?.sales}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                 <span>Revenue:</span>
                         <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>€{analytics.topSellingDates[0]?.revenue?.toFixed(2) || '0.00'}</span>
                       </div>
                     </>
                   )}
                 </div>
               </div>

              {/* Daily Breakdown */}
              {analytics.dailyBreakdownArray && analytics.dailyBreakdownArray.length > 0 && (
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  marginBottom: '30px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📅 Daily Breakdown (Last 30 Days)</h3>
                  <div className="ticket-table-wrapper">
                    <table className="ticket-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Sales</th>
                          <th>Tickets</th>
                          <th>Half-Time Tickets</th>
                          <th>Socks</th>
                          <th>Bundles</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.dailyBreakdownArray.slice(0, 30).map((day, index) => (
                          <tr key={index}>
                            <td>{formatDate(day.date)}</td>
                            <td>{day.sales}</td>
                            <td>{day.tickets}</td>
                            <td>{day.halfTimeTickets || 0}</td>
                            <td>{day.socks}</td>
                            <td>{day.bundles}</td>
                            <td>€{day.revenue?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Weekly Breakdown */}
              {analytics.weeklyBreakdownArray && analytics.weeklyBreakdownArray.length > 0 && (
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  marginBottom: '30px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Weekly Breakdown</h3>
                  <div className="ticket-table-wrapper">
                    <table className="ticket-table">
                      <thead>
                        <tr>
                          <th>Week Starting</th>
                          <th>Sales</th>
                          <th>Tickets</th>
                          <th>Half-Time Tickets</th>
                          <th>Socks</th>
                          <th>Bundles</th>
                          <th>Revenue</th>
                          <th>Avg Daily Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.weeklyBreakdownArray.map((week, index) => (
                          <tr key={index}>
                            <td>{formatDate(week.weekStart)}</td>
                            <td>{week.sales}</td>
                            <td>{week.tickets}</td>
                            <td>{week.halfTimeTickets || 0}</td>
                            <td>{week.socks}</td>
                            <td>{week.bundles}</td>
                            <td>€{week.revenue?.toFixed(2) || '0.00'}</td>
                            <td>{week.averageDailySales?.toFixed(1) || '0.0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monthly Breakdown */}
              {analytics.monthlyBreakdownArray && analytics.monthlyBreakdownArray.length > 0 && (
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📈 Monthly Breakdown</h3>
                  <div className="ticket-table-wrapper">
                    <table className="ticket-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Sales</th>
                          <th>Tickets</th>
                          <th>Half-Time Tickets</th>
                          <th>Socks</th>
                          <th>Bundles</th>
                          <th>Revenue</th>
                          <th>Avg Daily Sales</th>
                          <th>Avg Weekly Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.monthlyBreakdownArray.map((month, index) => (
                          <tr key={index}>
                            <td>{month.month}</td>
                            <td>{month.sales}</td>
                            <td>{month.tickets}</td>
                            <td>{month.halfTimeTickets || 0}</td>
                            <td>{month.socks}</td>
                            <td>{month.bundles}</td>
                            <td>€{month.revenue?.toFixed(2) || '0.00'}</td>
                            <td>{month.averageDailySales?.toFixed(1) || '0.0'}</td>
                            <td>{month.averageWeeklySales?.toFixed(1) || '0.0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      

      {/* Cancel Requests */}
      <div className="dashboard-section">
        <div className="section-header" style={{ cursor: "pointer" }} onClick={() => toggleSection('cancelRequests')}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h2>{t('admin.cancelRequests')}</h2>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{collapsedSections.cancelRequests ? '▼' : '▲'}</span>
          </div>
        </div>
        {!collapsedSections.cancelRequests && (
          <div className="ticket-table-wrapper">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>{t('admin.ticketId')}</th>
                  <th>{t('admin.name')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.reason')}</th>
                  <th>{t('admin.requestedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCancelRequests.length > 0 ? (
                  paginatedCancelRequests.map((req) => (
                    <tr key={req._id}>
                      <td>{req.ticketId}</td>
                      <td>{req.name || "N/A"}</td>
                      <td>{req.email}</td>
                      <td>{req.reason || "—"}</td>
                      <td>{new Date(req.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      {t('admin.noCancelRequestsFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {cancelRequests.length > CANCELS_PER_PAGE && (
              <div className="pagination-controls">
                <button onClick={() => setCancelPage(cancelPage - 1)} disabled={cancelPage === 1}>{t('admin.prev')}</button>
                <span>{t('admin.page')} {cancelPage} {t('admin.of')} {Math.ceil(cancelRequests.length / CANCELS_PER_PAGE)}</span>
                <button onClick={() => setCancelPage(cancelPage + 1)} disabled={cancelPage === Math.ceil(cancelRequests.length / CANCELS_PER_PAGE)}>{t('admin.next')}</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {settingsModal.open && (
        <SettingsModal
          data={settingsModal.data}
          onClose={() => setSettingsModal({ open: false, data: null })}
          onSaved={() => {
            setSettingsModal({ open: false, data: null });
            fetchData();
          }}
        />
      )}

      {timeslotModal.open && (
        <TimeSlotModal
          data={timeslotModal.data}
          setting={settings}
          onClose={() => setTimeSlotModal({ open: false, data: null })}
          onSaved={() => {
            setTimeSlotModal({ open: false, data: null });
            fetchData();
          }}
        />
      )}

      {bundelsModal.open && (
        <AddBundelsModal
          data={bundelsModal.data}
          onClose={() => setBundelsModal({ open: false, data: null })}
          onSaved={() => {
            setBundelsModal({ open: false, data: null });
            fetchData();
          }}
        />
      )}

      {discountVouchersModal && (
        <DiscountVouchers
          isOpen={discountVouchersModal}
          onClose={() => setDiscountVouchersModal(false)}
        />
      )}

      {showPrompt && (
        <div className="admin-modal-overlay">
          <div className="modal-box">
            <h3>{t('admin.confirmAdminAccess')}</h3>
            <p>{t('admin.deleteAllTicketsConfirm')}</p>

            <input 
              type="email"
              placeholder={t('admin.adminEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginTop: 10, height: '35px',   borderRadius: '8px', fontSize: '20px', backgroundColor: 'white'}}
            />
            <input
              type="password"
              placeholder={t('admin.adminPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 10, height: '35px',   borderRadius: '8px', fontSize: '20px', backgroundColor: 'white'}}
            />

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button onClick={() => setShowPrompt(false)} disabled={deleting}>
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete} disabled={deleting}>
                {deleting ? t('admin.deleting') : t('admin.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;