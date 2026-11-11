import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  Lock, 
  Mail, 
  KeyRound, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { resilientFetch } from "../apiConfig";

export default function LoginModal() {
  const navigate = useNavigate();
  const { isLoginModalOpen, targetFeature, closeLoginModal, login } = useAuth();

  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Creator Intelligence Analyst");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isLoginModalOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await resilientFetch("/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate security OTP.");
      }

      setStatusMessage(data.message || `OTP verification code sent to ${email}`);
      setStep("otp");
    } catch (err) {
      setErrorMessage(err.message || "Failed to contact authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await resilientFetch("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp: otp.trim(), 
          name, 
          role 
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }

      const verifiedUser = data.user;
      login(verifiedUser, data.token);

      // Close modal and redirect to requested feature or dashboard
      closeLoginModal();
      if (targetFeature && targetFeature.url) {
        navigate(targetFeature.url);
      } else {
        navigate("/dashboard-analytics");
      }
    } catch (err) {
      setErrorMessage(err.message || "Verification failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    closeLoginModal();
  };

  const handleStayOnDashboard = () => {
    closeLoginModal();
    navigate("/dashboard-analytics");
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div 
        style={{
          background: "#161616",
          border: "1px solid #2d2d2d",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          color: "#ffffff",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(255, 0, 0, 0.2)",
          position: "relative",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out"
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(-12px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}} />

        {/* Top Decorative Red Accent Bar */}
        <div style={{
          height: "3px",
          background: "linear-gradient(90deg, #FF0000, #ff4d4d, #FF0000)",
          width: "100%"
        }} />

        {/* Modal Header */}
        <div style={{
          padding: "20px 24px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid #242424"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(255, 0, 0, 0.15)",
              border: "1px solid rgba(255, 0, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FF0000",
              boxShadow: "0 0 16px rgba(255, 0, 0, 0.3)"
            }}>
              <Lock size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Sign In Required
                </span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  background: "#FF0000",
                  color: "#ffffff",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  textTransform: "uppercase"
                }}>
                  OTP
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#aaaaaa" }}>
                Mandatory step to access analytical deep-dives
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              background: "#212121",
              border: "1px solid #333333",
              color: "#aaaaaa",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.borderColor = "#FF0000"; }}
            onMouseOut={(e) => { e.currentTarget.style.color = "#aaaaaa"; e.currentTarget.style.borderColor = "#333333"; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Feature Lock Notice Pill */}
        <div style={{ padding: "14px 24px 0" }}>
          <div style={{
            background: "rgba(255, 0, 0, 0.08)",
            border: "1px solid rgba(255, 0, 0, 0.25)",
            borderRadius: "8px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px"
          }}>
            <ShieldCheck size={16} color="#FF0000" style={{ marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
              <strong style={{ color: "#ffffff", display: "block", marginBottom: "2px" }}>
                Protected Feature: {targetFeature?.name || "Analytical Intelligence"}
              </strong>
              <span style={{ color: "#bbbbbb" }}>
                Only the Trending Dashboard is open for public preview. Full audience sentiment, content topology graphs, and creator audits require authentication.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "18px 24px 22px" }}>
          {errorMessage && (
            <div style={{
              background: "rgba(255, 0, 0, 0.14)",
              border: "1px solid rgba(255, 0, 0, 0.35)",
              color: "#ff5252",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{statusMessage}</span>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp}>
              {/* Email Input */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "5px", letterSpacing: "0.04em" }}>
                  Creator Email Address *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color="#777777" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. creator@gmail.com"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      background: "#1f1f1f",
                      border: "1px solid #333333",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#FF0000"}
                    onBlur={(e) => e.target.style.borderColor = "#333333"}
                  />
                </div>
              </div>

              {/* Creator Name (Optional) */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "5px", letterSpacing: "0.04em" }}>
                  Creator / Channel Name (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} color="#777777" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CarryMinati Studio"
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      background: "#1f1f1f",
                      border: "1px solid #333333",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#FF0000"}
                    onBlur={(e) => e.target.style.borderColor = "#333333"}
                  />
                </div>
              </div>

              {/* Role Select */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "5px", letterSpacing: "0.04em" }}>
                  Creator Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#1f1f1f",
                    border: "1px solid #333333",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="Creator Intelligence Analyst">Creator Intelligence Analyst</option>
                  <option value="YouTube Studio Manager">YouTube Studio Manager</option>
                  <option value="Brand Growth Strategist">Brand Growth Strategist</option>
                  <option value="Content Topology Researcher">Content Topology Researcher</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#FF0000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(255, 0, 0, 0.4)",
                  transition: "background 0.15s ease",
                  opacity: loading ? 0.7 : 1
                }}
                onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = "#cc0000"; }}
                onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = "#FF0000"; }}
              >
                {loading ? (
                  <span>Generating Secure OTP...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(255, 0, 0, 0.15)",
                  color: "#FF0000",
                  marginBottom: "8px"
                }}>
                  <KeyRound size={22} />
                </div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "800" }}>
                  Enter 6-Digit Verification Code
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#aaaaaa" }}>
                  Check your inbox for <strong style={{ color: "#ffffff" }}>{email}</strong>
                </p>
              </div>

              {/* 6-Digit OTP Field */}
              <div style={{ marginBottom: "18px" }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#1f1f1f",
                    border: "2px solid #FF0000",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: "800",
                    textAlign: "center",
                    letterSpacing: "0.3em",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  style={{
                    flex: "0 0 35%",
                    padding: "10px",
                    background: "#242424",
                    border: "1px solid #333333",
                    color: "#ffffff",
                    borderRadius: "18px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Change Email
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: "1",
                    padding: "10px",
                    background: "#FF0000",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "18px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(255, 0, 0, 0.4)",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Unlock Feature"}
                </button>
              </div>
            </form>
          )}

          {/* Bottom Footer Navigation Helper */}
          <div style={{
            marginTop: "18px",
            paddingTop: "14px",
            borderTop: "1px solid #242424",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px"
          }}>
            <button
              type="button"
              onClick={handleStayOnDashboard}
              style={{
                background: "transparent",
                border: "none",
                color: "#888888",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                fontSize: "11px"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseOut={(e) => e.currentTarget.style.color = "#888888"}
            >
              Continue on Dashboard Preview
            </button>

            <button
              type="button"
              onClick={() => {
                closeLoginModal();
                navigate("/login");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#FF0000",
                cursor: "pointer",
                padding: 0,
                fontWeight: "700",
                fontSize: "11px"
              }}
            >
              Full Profile Portal ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
