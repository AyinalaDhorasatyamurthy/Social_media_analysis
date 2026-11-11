import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, LogIn, BarChart3, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NavBar from "./Navbar";

export default function ProtectedRoute({ children, featureName = "Analytical Feature" }) {
  const { isAuthenticated, openLoginModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      openLoginModal(location.pathname, featureName);
    }
  }, [isAuthenticated, location.pathname, featureName, openLoginModal]);

  if (isAuthenticated) {
    return children;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "#ffffff",
      fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <NavBar />
      
      <div style={{
        maxWidth: "600px",
        margin: "80px auto 40px",
        padding: "36px 28px",
        background: "#161616",
        border: "1px solid #292929",
        borderRadius: "16px",
        textAlign: "center",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)"
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "rgba(255, 0, 0, 0.15)",
          border: "1px solid rgba(255, 0, 0, 0.35)",
          color: "#FF0000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
          boxShadow: "0 0 20px rgba(255, 0, 0, 0.3)"
        }}>
          <Lock size={26} strokeWidth={2.4} />
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(255, 0, 0, 0.1)",
          border: "1px solid rgba(255, 0, 0, 0.25)",
          color: "#ff4d4d",
          fontSize: "11px",
          fontWeight: "700",
          padding: "3px 10px",
          borderRadius: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "12px"
        }}>
          <ShieldAlert size={13} />
          <span>Access Restricted</span>
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 8px 0" }}>
          Authentication Required
        </h2>

        <p style={{ fontSize: "14px", color: "#aaaaaa", lineHeight: "1.6", margin: "0 0 24px 0" }}>
          Access to <strong>{featureName}</strong> is restricted to authenticated users. Only the Trending Dashboard is open for public preview. Please sign in with OTP to continue.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => openLoginModal(location.pathname, featureName)}
            style={{
              padding: "10px 24px",
              background: "#FF0000",
              color: "#ffffff",
              border: "none",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(255, 0, 0, 0.35)",
              transition: "background 0.15s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#cc0000"}
            onMouseOut={(e) => e.currentTarget.style.background = "#FF0000"}
          >
            <LogIn size={15} />
            <span>Sign In with OTP</span>
          </button>

          <button
            onClick={() => navigate("/dashboard-analytics")}
            style={{
              padding: "10px 20px",
              background: "#222222",
              color: "#ffffff",
              border: "1px solid #333333",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.15s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#2c2c2c"}
            onMouseOut={(e) => e.currentTarget.style.background = "#222222"}
          >
            <BarChart3 size={15} />
            <span>Go to Dashboard Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
