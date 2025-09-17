import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import "./App.css";
import TicketBooking from "./pages/TicketBooking";
import { Footer } from "./components/Footer";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import PaymentSuccess from "./pages/PaymentSuccess";
import WalkinTickets from "./pages/WalkinTickets";
import AdminCashPayment from "./pages/AdminCashPayment";
import ProtectedRoute from "./components/ProtectedRoute";
import LanguageSwitcher from "./components/LanguageSwitcher";
import TestI18n from "./components/TestI18n";

function App() {
  return (
    <>
      <LanguageSwitcher />
      <Router>
        <Routes>
          <Route path="/" element={<TicketBooking />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="adminJump">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route
            path="/ticket-booking/:sessionId"
            element={<TicketBooking />}
          />
          <Route path="/ticket-booking" element={<TicketBooking />} />
          <Route path="/walkinTickets" element={<WalkinTickets />} />
          <Route path="/walkinTickets/:sessionId" element={<WalkinTickets />} />
          <Route
            path="/megajumpcashpayment"
            element={
              <ProtectedRoute requiredRole="cashier">
                <AdminCashPayment />
              </ProtectedRoute>
            }
          />
          <Route path="/test-i18n" element={<TestI18n />} />
        </Routes>
      </Router>
      <Footer />
    </>
  );
}

export default App;
