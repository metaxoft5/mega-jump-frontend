import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "../assets/style/adminPanel.css";
import logo from "../assets/logo.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminLogin = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

  const BASE_URL = "https://api.megajumpparktickets.eu";

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      toast.warn(t('errors.invalidInput'));
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/admin/login`,
        form,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        }
      );

      const role = response?.data?.role;
      const success = response?.data?.success;
      
      console.log("🔐 Login response:", response?.data);
      console.log("Role:", role);
      console.log("Success:", success);
      
      if (success && (role === "adminJump" || role === "cashier")) {
        sessionStorage.setItem("adminRole", role);
        sessionStorage.setItem("adminUsername", form.username);
        
        console.log("✅ Session storage set:");
        console.log("adminRole:", role);
        console.log("adminUsername:", form.username);
        
        // Redirect based on role and redirect parameter
        let redirectPath;
        if (role === "adminJump") {
          redirectPath = "/admin/dashboard";
        } else if (role === "cashier") {
          // For cashier, check if there's a specific redirect parameter
          if (redirectTo && redirectTo !== '/admin/dashboard') {
            redirectPath = redirectTo;
          } else {
            redirectPath = "/megajumpcashpayment";
          }
        } else {
          redirectPath = redirectTo;
        }
        
        console.log("🔐 Login successful - redirecting to:", redirectPath);
        console.log("Role:", role);
        console.log("Redirect parameter:", redirectTo);
        
        toast.success(t('messages.loginSuccess'), {
          onClose: () => {
            window.location.href = redirectPath;
          },
        });
      } else {
        console.log("❌ Login failed - Invalid credentials or unauthorized role");
        toast.error(t('errors.unauthorized'));
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        toast.error("❌ Invalid username or password");
      } else if (error.response?.status === 403) {
        toast.error("❌ Access denied - Unauthorized role");
      } else if (error.response?.data?.message) {
        toast.error(`❌ ${error.response.data.message}`);
      } else if (error.code === 'ECONNABORTED') {
        toast.error("❌ Connection timeout - Please try again");
      } else {
        toast.error("❌ Login failed - Please check your credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="login-box">
        <img src={logo} alt="MegaJump Logo" className="login-logo" />
        <h2>{t('admin.dashboard')}</h2>

        <input
          type="text"
          name="username"
          placeholder={t('admin.adminEmail')}
          value={form.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder={t('admin.adminPassword')}
          value={form.password}
          onChange={handleChange}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? <span className="loader"></span> : t('common.login')}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
