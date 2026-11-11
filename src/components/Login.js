import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Mail, 
  KeyRound, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  Edit3, 
  BarChart3, 
  Activity, 
  Network, 
  Users 
} from "lucide-react";
import NavBar from "./Navbar";
import InsightSphere3DCanvas from "./InsightSphere3DCanvas";
import { resilientFetch } from "../apiConfig";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login: authLogin, logout: authLogout } = useAuth();

  // Authentication states
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState("email"); // 'email' | 'otp' | 'profile'
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Creator Intelligence Analyst");
  const [otp, setOtp] = useState("");
  
  // UI status states
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");

  // Check if already authenticated on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("insightsphere_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
          setStep("profile");
          setEditName(parsed.name || "");
          setEditRole(parsed.role || "");
          setEditBio(parsed.bio || "");
        }
      }
    } catch (e) {
      console.warn("Storage parse error", e);
    }
  }, []);

  // 1. Send OTP Request
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

  // 2. Verify OTP and Create / Login Profile
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

      const user = data.user;
      setCurrentUser(user);
      authLogin(user, data.token);

      setEditName(user.name);
      setEditRole(user.role);
      setEditBio(user.bio);
      setStep("profile");
      setStatusMessage(`Welcome, ${user.name}! Profile authenticated successfully.`);
    } catch (err) {
      setErrorMessage(err.message || "Verification failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Update Profile in MongoDB
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      const res = await resilientFetch("/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          name: editName,
          role: editRole,
          bio: editBio
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("insightsphere_user", JSON.stringify(data.user));
        setIsEditing(false);
        setStatusMessage("Profile updated successfully!");
      }
    } catch (e) {
      setErrorMessage("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout
  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
    setStep("email");
    setOtp("");
    setStatusMessage("You have been signed out.");
  };

  // Paste OTP Helper
  const handlePasteOtp = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setOtp(clean);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "#ffffff",
      fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative",
      overflowX: "hidden"
    }}>
      <NavBar />

      <main style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "3rem 1.5rem 6rem",
        position: "relative",
        zIndex: 2
      }}>

        {/* 3D Ambient Visual Canvas */}
        <div style={{
          position: "relative",
          height: "220px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem"
        }}>
          <InsightSphere3DCanvas height="220px" radius={110} nodeCount={55} />
          
          <div style={{
            position: "absolute",
            textAlign: "center",
            pointerEvents: "none"
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 0, 0, 0.12)",
              border: "1px solid rgba(255, 0, 0, 0.3)",
              padding: "4px 12px",
              borderRadius: "14px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#ff4d4d",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px"
            }}>
              <ShieldCheck size={14} />
              <span>Secure Authentication</span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              color: "#ffffff"
            }}>
              InsightSphere <span style={{ color: "#FF0000" }}>Profile & Access</span>
            </h1>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: "rgba(255, 0, 0, 0.12)",
            border: "1px solid rgba(255, 0, 0, 0.3)",
            color: "#ff4d4d",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "1.5rem"
          }}>
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Enter Email & Name */}
        {step === "email" && (
          <div style={{
            maxWidth: "460px",
            margin: "0 auto",
            background: "#181818",
            border: "1px solid #272727",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", margin: "0 0 6px 0", color: "#ffffff" }}>
                Sign In with One-Time Password
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#aaaaaa" }}>
                Enter your email address. We will generate and dispatch a secure 6-digit OTP code to your inbox.
              </p>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "6px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#717171" }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. creator@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px 10px 38px",
                      background: "#0f0f0f",
                      border: "1px solid #303030",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "6px" }}>
                  Your Name (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#717171" }} />
                  <input
                    type="text"
                    placeholder="e.g. Satyamurthy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px 10px 38px",
                      background: "#0f0f0f",
                      border: "1px solid #303030",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "0.5rem",
                  padding: "12px",
                  background: "#FF0000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(255, 0, 0, 0.4)"
                }}
              >
                <span>{loading ? "Issuing Security Code..." : "Send Verification OTP"}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Paste 6-Digit OTP */}
        {step === "otp" && (
          <div style={{
            maxWidth: "460px",
            margin: "0 auto",
            background: "#181818",
            border: "1px solid #272727",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 0, 0, 0.12)",
                color: "#FF0000",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px"
              }}>
                <KeyRound size={24} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", margin: "0 0 6px 0", color: "#ffffff" }}>
                Enter 6-Digit Verification Code
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#aaaaaa", lineHeight: "1.5" }}>
                Sent to <strong style={{ color: "#ffffff" }}>{email}</strong>. Please enter the verification code sent to your email to continue.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "6px" }}>
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  value={otp}
                  onChange={(e) => handlePasteOtp(e.target.value)}
                  onPaste={(e) => {
                    const pasteData = e.clipboardData.getData("text");
                    handlePasteOtp(pasteData);
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    textAlign: "center",
                    letterSpacing: "10px",
                    fontFamily: "monospace",
                    fontSize: "24px",
                    fontWeight: "900",
                    padding: "12px",
                    background: "#0f0f0f",
                    border: "1.5px solid #FF0000",
                    borderRadius: "8px",
                    color: "#ffffff",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "6px" }}>
                  Creator Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    background: "#0f0f0f",
                    border: "1px solid #303030",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none"
                  }}
                >
                  <option value="Creator Intelligence Analyst">Creator Intelligence Analyst</option>
                  <option value="Executive Producer / Creator">Executive Producer / Creator</option>
                  <option value="Channel Operations Manager">Channel Operations Manager</option>
                  <option value="Audience Growth Specialist">Audience Growth Specialist</option>
                  <option value="Brand Partnership Strategist">Brand Partnership Strategist</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "#212121",
                    color: "#aaaaaa",
                    border: "1px solid #303030",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: "11px",
                    background: "#FF0000",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: loading ? "wait" : "pointer",
                    boxShadow: "0 4px 14px rgba(255, 0, 0, 0.4)"
                  }}
                >
                  {loading ? "Authenticating Profile..." : "Verify & Launch Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Authenticated User Profile Dashboard */}
        {step === "profile" && currentUser && (
          <div style={{
            background: "#181818",
            border: "1px solid #272727",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
          }}>
            {/* Top Profile Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1.5rem",
              borderBottom: "1px solid #272727",
              paddingBottom: "1.75rem",
              marginBottom: "1.75rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.email}`}
                  alt={currentUser.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    border: "2px solid #FF0000",
                    background: "#212121"
                  }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", color: "#ffffff" }}>
                      {currentUser.name}
                    </h2>
                    <span style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      ✓ Verified Member
                    </span>
                  </div>
                  <div style={{ color: "#3ea6ff", fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
                    {currentUser.role}
                  </div>
                  <div style={{ color: "#aaaaaa", fontSize: "12px", marginTop: "2px" }}>
                    {currentUser.email} &bull; Member since {new Date(currentUser.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#212121",
                    border: "1px solid #303030",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "18px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  <Edit3 size={14} />
                  <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 0, 0, 0.12)",
                    border: "1px solid rgba(255, 0, 0, 0.25)",
                    color: "#ff4d4d",
                    padding: "8px 16px",
                    borderRadius: "18px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Edit Profile Form */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} style={{
                background: "#121212",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                marginBottom: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase" }}>
                  Update Profile Details
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#aaaaaa", marginBottom: "4px" }}>Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: "#181818", border: "1px solid #303030", borderRadius: "6px", color: "#ffffff", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#aaaaaa", marginBottom: "4px" }}>Role / Designation</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: "#181818", border: "1px solid #303030", borderRadius: "6px", color: "#ffffff", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#aaaaaa", marginBottom: "4px" }}>Creator Bio</label>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Brief description about your channels or audience goals..."
                    style={{ width: "100%", padding: "8px 12px", background: "#181818", border: "1px solid #303030", borderRadius: "6px", color: "#ffffff", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{ padding: "7px 14px", background: "#212121", color: "#aaaaaa", border: "1px solid #303030", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: "7px 16px", background: "#FF0000", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Profile Metrics Strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              <div style={{ background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "11px", color: "#aaaaaa", textTransform: "uppercase", fontWeight: "700" }}>Authentication Status</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#10b981", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Completed</span>
                </div>
                <div style={{ fontSize: "11px", color: "#aaaaaa", marginTop: "2px" }}>Verified & Active</div>
              </div>

              <div style={{ background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "11px", color: "#aaaaaa", textTransform: "uppercase", fontWeight: "700" }}>Active Sessions</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>
                  {currentUser.login_count || 1} Active Session{(currentUser.login_count || 1) > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "11px", color: "#aaaaaa", marginTop: "2px" }}>Current Device Connected</div>
              </div>

              <div style={{ background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "11px", color: "#aaaaaa", textTransform: "uppercase", fontWeight: "700" }}>Account Status</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#3ea6ff", marginTop: "4px" }}>Verified Member</div>
                <div style={{ fontSize: "11px", color: "#aaaaaa", marginTop: "2px" }}>{currentUser.role || "Creator Profile"}</div>
              </div>
            </div>

            {/* Quick Launchpad to Tools */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", textTransform: "uppercase", marginBottom: "1rem" }}>
                Quick Access Creator Tools
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <Link to="/dashboard-analytics" style={{ textDecoration: "none", background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem", display: "flex", alignItems: "center", gap: "10px", color: "#ffffff" }}>
                  <BarChart3 size={20} color="#FF0000" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>Trending Dashboard</div>
                    <div style={{ fontSize: "11px", color: "#aaaaaa" }}>Global Regional Feeds</div>
                  </div>
                </Link>

                <Link to="/sentiment-analysis" style={{ textDecoration: "none", background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem", display: "flex", alignItems: "center", gap: "10px", color: "#ffffff" }}>
                  <Activity size={20} color="#FF0000" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>Sentiment & Attention</div>
                    <div style={{ fontSize: "11px", color: "#aaaaaa" }}>Audience Retention</div>
                  </div>
                </Link>

                <Link to="/network-visualization" style={{ textDecoration: "none", background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem", display: "flex", alignItems: "center", gap: "10px", color: "#ffffff" }}>
                  <Network size={20} color="#3ea6ff" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>Content Topology</div>
                    <div style={{ fontSize: "11px", color: "#aaaaaa" }}>TF-IDF Semantic Clusters</div>
                  </div>
                </Link>

                <Link to="/influencer-detection" style={{ textDecoration: "none", background: "#212121", border: "1px solid #2e2e2e", borderRadius: "10px", padding: "1rem", display: "flex", alignItems: "center", gap: "10px", color: "#ffffff" }}>
                  <Users size={20} color="#3ea6ff" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>Influencers</div>
                    <div style={{ fontSize: "11px", color: "#aaaaaa" }}>Verification & Benchmark</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
