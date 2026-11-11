import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Activity, 
  Network, 
  Users, 
  Sparkles, 
  FileText, 
  Play,
  LogIn,
  Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function NavBar() {
  const location = useLocation();
  const { currentUser, isAuthenticated, openLoginModal } = useAuth();

  const navLinks = [
    { to: "/dashboard-analytics", label: "Dashboard", icon: BarChart3, isPublic: true },
    { to: "/sentiment-analysis", label: "Sentiment", icon: Activity, isPublic: false },
    { to: "/network-visualization", label: "Topology", icon: Network, isPublic: false },
    { to: "/influencer-detection", label: "Influencers", icon: Users, isPublic: false },
    { to: "/recommendations", label: "Recommendations", icon: Sparkles, isPublic: false },
    { to: "/reports", label: "Executive Reports", icon: FileText, isPublic: false },
  ];

  const handleNavLinkClick = (e, link) => {
    if (link.isPublic) {
      // Public route (Dashboard) -> allow normal navigation
      return;
    }

    if (!isAuthenticated) {
      // Mandatory login: block navigation and raise pop-up
      e.preventDefault();
      openLoginModal(link.to, link.label);
    }
  };

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 1000,
      background: "#0f0f0f",
      borderBottom: "1px solid #272727",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 5%",
      fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Brand: InsightSphere STUDIO (Left Side) */}
      <Link to="/" style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
        flexShrink: 0
      }}>
        {/* YouTube Iconic Red Play Button Badge */}
        <div style={{
          width: "30px",
          height: "22px",
          borderRadius: "6px",
          background: "#FF0000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          boxShadow: "0 0 12px rgba(255, 0, 0, 0.45)"
        }}>
          <Play size={12} fill="#ffffff" strokeWidth={0} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{
            fontWeight: "800",
            fontSize: "18px",
            color: "#ffffff",
            letterSpacing: "-0.03em"
          }}>
            InsightSphere
          </span>
          <span style={{
            fontSize: "10px",
            fontWeight: "700",
            color: "#aaaaaa",
            textTransform: "uppercase",
            letterSpacing: "0.08em"
          }}>
            STUDIO
          </span>
        </div>
      </Link>

      {/* Right Container: All Nav Links + Auth grouped together on the Right */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginLeft: "auto"
      }}>
        {/* Navigation Tabs */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            const isLocked = !link.isPublic && !isAuthenticated;

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavLinkClick(e, link)}
                title={isLocked ? `${link.label} (Login required)` : link.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "18px",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  textDecoration: "none",
                  color: isActive ? "#ffffff" : "#aaaaaa",
                  background: isActive ? "#272727" : "transparent",
                  border: isActive ? "1px solid #3f3f3f" : "1px solid transparent",
                  transition: "all 0.15s ease",
                  position: "relative",
                  whiteSpace: "nowrap",
                  cursor: "pointer"
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.4 : 1.8} color={isActive ? "#FF0000" : "#aaaaaa"} />
                <span>{link.label}</span>
                {isLocked && (
                  <Lock size={11} color="#ff6b6b" style={{ opacity: 0.85, marginLeft: "-2px" }} />
                )}
                {isActive && (
                  <span style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "15%",
                    right: "15%",
                    height: "2px",
                    background: "#FF0000",
                    borderRadius: "2px"
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Subtle Vertical Divider */}
        <div style={{
          height: "20px",
          width: "1px",
          background: "#272727",
          margin: "0 4px"
        }} />

        {/* User Authentication Profile Pill */}
        {isAuthenticated && currentUser ? (
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#212121",
              border: "1px solid #303030",
              color: "#ffffff",
              padding: "4px 12px 4px 6px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              textDecoration: "none",
              transition: "border-color 0.15s ease",
              flexShrink: 0
            }}
          >
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.email}`}
              alt={currentUser.name}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#0f0f0f"
              }}
            />
            <span>{currentUser.name || currentUser.email.split("@")[0]}</span>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px #10b981"
            }} />
          </Link>
        ) : (
          <button
            onClick={() => openLoginModal("", "InsightSphere Analytics")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#FF0000",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "18px",
              fontSize: "12px",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(255, 0, 0, 0.35)",
              transition: "background 0.15s ease",
              whiteSpace: "nowrap",
              flexShrink: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#cc0000"}
            onMouseOut={(e) => e.currentTarget.style.background = "#FF0000"}
          >
            <LogIn size={13} strokeWidth={2.4} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default NavBar;
