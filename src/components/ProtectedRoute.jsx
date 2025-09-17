import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = 'adminJump' }) => {
  const location = useLocation();
  
  // Check if admin is logged in
  const adminRole = sessionStorage.getItem('adminRole');
  const adminUsername = sessionStorage.getItem('adminUsername');
  
  console.log("🔐 ProtectedRoute - Checking authentication...");
  console.log("Required role:", requiredRole);
  console.log("Current role:", adminRole);
  console.log("Username:", adminUsername);
  console.log("Current path:", location.pathname);

  // Check if user is authenticated and has the required role
  if (!adminRole || !adminUsername || adminRole !== requiredRole) {
    console.log("❌ ProtectedRoute - Authentication failed - redirecting to login");
    console.log("Expected role:", requiredRole, "Got role:", adminRole);
    
    // Clear any existing session data to prevent loops
    sessionStorage.removeItem("adminRole");
    sessionStorage.removeItem("adminUsername");
    
    // Redirect to admin login with the current path as redirect parameter
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  console.log("✅ ProtectedRoute - Authentication successful");
  // Render the protected component if authenticated
  return children;
};

export default ProtectedRoute; 