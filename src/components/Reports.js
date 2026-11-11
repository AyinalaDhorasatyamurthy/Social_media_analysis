import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { saveAs } from "file-saver";
import { 
  FileText, 
  Download, 
  Send, 
  Check, 
  AlertCircle, 
  Info, 
  Layers, 
  Activity, 
  Users, 
  Network, 
  Sparkles, 
  Mail, 
  CheckCircle2, 
  Calendar, 
  Clock 
} from "lucide-react";
import { resilientFetch } from "../apiConfig";
import NavBar from "./Navbar";


// ==========================================
// STYLED COMPONENTS (Enterprise Dark Architecture)
// ==========================================
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #0f0f0f;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 5rem;
`;

const ContentContainer = styled.main`
  max-width: 1240px;
  margin: 0 auto;
  padding: 2.25rem 1.5rem;
`;

const HeaderBanner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #272727;
  padding-bottom: 1.5rem;

  .title-area h1 {
    margin: 0;
    font-size: 1.65rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #ffffff;
  }

  .title-area p {
    margin: 6px 0 0 0;
    color: #aaaaaa;
    font-size: 0.9rem;
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 1.75rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const CardPanel = styled.div`
  background: #181818;
  border: 1px solid #272727;
  border-radius: 10px;
  padding: 1.5rem 1.75rem;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #272727;
  padding-bottom: 0.85rem;
  margin-bottom: 1.25rem;

  h2 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sub-tag {
    font-size: 0.72rem;
    color: #717171;
    font-weight: 500;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.2rem;

  label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #cccccc;
    margin-bottom: 0.45rem;
  }

  input, select {
    width: 100%;
    box-sizing: border-box;
    background: #0f0f0f;
    border: 1px solid #272727;
    border-radius: 6px;
    padding: 9px 12px;
    color: #ffffff;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;

    &:focus {
      border-color: #FF0000;
    }
  }
`;

const ScopeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const ScopeChip = styled.div`
  background: ${(props) => (props.$active ? "rgba(255, 0, 0, 0.12)" : "#0f0f0f")};
  border: 1px solid ${(props) => (props.$active ? "#FF0000" : "#272727")};
  color: ${(props) => (props.$active ? "#FF0000" : "#aaaaaa")};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: #FF0000;
  }
`;

const FormatSegment = styled.div`
  display: flex;
  gap: 6px;
  background: #0f0f0f;
  border: 1px solid #272727;
  border-radius: 6px;
  padding: 4px;
`;

const FormatOption = styled.button`
  flex: 1;
  background: ${(props) => (props.$active ? "rgba(255, 255, 255, 0.08)" : "transparent")};
  border: 1px solid ${(props) => (props.$active ? "rgba(255, 255, 255, 0.12)" : "transparent")};
  color: ${(props) => (props.$active ? "#ffffff" : "#aaaaaa")};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionBtn = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.15s ease;

  &.download { background: #FF0000; color: #ffffff; border-radius: 18px; font-weight: 700; &:hover:not(:disabled) { background: #cc0000; } }
  }

  &.email { background: #212121; border: 1px solid #383838; border-radius: 18px; color: #ffffff; font-weight: 700; &:hover:not(:disabled) { background: #2e2e2e; } }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PreviewPaper = styled.div`
  background: #0f0f0f;
  border: 1px solid #272727;
  border-radius: 8px;
  padding: 1.5rem;
  font-size: 13px;
  color: #cccccc;

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #272727;
    padding-bottom: 1rem;
    margin-bottom: 1.25rem;
  }

  .doc-brand {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #FF0000;
    letter-spacing: 0.05em;
  }

  .doc-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #ffffff;
    margin: 3px 0 0 0;
  }

  .doc-sub {
    font-size: 12px;
    color: #717171;
    margin-top: 3px;
  }

  .doc-badge {
    text-align: right;
    .badge-label {
      font-size: 10px;
      font-weight: 600;
      color: #717171;
      text-transform: uppercase;
    }
    .badge-grade {
      font-size: 1.25rem;
      font-weight: 800;
      color: #10b981;
    }
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.65rem;
    margin: 1.25rem 0;
  }

  .preview-cell {
    background: #181818;
    border: 1px solid #272727;
    border-radius: 6px;
    padding: 0.75rem;
    text-align: center;

    .cell-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #717171;
    }

    .cell-val {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
      margin-top: 2px;
    }
  }
`;

function Reports() {
  const [channelName, setChannelName] = useState("");
  const [reportType, setReportType] = useState("Executive Performance Analysis");
  const [email, setEmail] = useState("");
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [success, setSuccess] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const [selectedModules, setSelectedModules] = useState({
    kpis: true,
    sentiment: true,
    network: true,
    recommendations: true,
  });

  const location = useLocation();

  const getTypoSuggestion = (emailStr) => {
    if (!emailStr || !emailStr.includes("@")) return null;
    const parts = emailStr.split("@");
    if (parts.length !== 2) return null;
    const domain = parts[1].trim().toLowerCase();
    const typoMap = {
      "gmial.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gmaill.com": "gmail.com",
      "yaho.com": "yahoo.com",
      "hotmial.com": "hotmail.com",
      "outlok.com": "outlook.com",
    };
    return typoMap[domain] || null;
  };

  const typoSuggestion = getTypoSuggestion(email);

  useEffect(() => {
    const savedType = location.state?.reportType || sessionStorage.getItem("reportType") || "Executive Performance Analysis";
    const rawData = sessionStorage.getItem("channelData");
    setReportType(savedType);

    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        setChannelData(parsed);
        if (parsed.channelName) {
          setChannelName(parsed.channelName);
        }
      } catch (err) {
        console.warn("Could not parse saved channelData:", err);
      }
    } else {
      setChannelName("MrBeast");
    }
  }, [location]);

  const toggleModule = (modKey) => {
    setSelectedModules((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  const handleDownload = async () => {
    if (!channelName.trim()) {
      setError("Please specify a target channel or subject name.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWarning(null);
      setSuccess(null);

      const response = await resilientFetch("/send/download_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: channelName.trim(),
          reportType,
          format,
          channelData,
          modules: Object.keys(selectedModules).filter((k) => selectedModules[k]),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate report download.");
      }

      const resData = await response.json();

      if (format === "pdf" || format === "html") {
        const blob = new Blob([resData.content], { type: "text/html;charset=utf-8" });
        saveAs(blob, resData.filename || `Report_${channelName.replace(/\s+/g, "_")}.html`);
        setSuccess("Report generated and downloaded. Open in browser to save/print as PDF.");
      } else if (format === "csv") {
        const blob = new Blob([resData.content], { type: "text/csv;charset=utf-8" });
        saveAs(blob, resData.filename || `Report_${channelName.replace(/\s+/g, "_")}.csv`);
        setSuccess("CSV dataset exported successfully.");
      } else {
        const blob = new Blob([resData.content], { type: "application/json;charset=utf-8" });
        saveAs(blob, resData.filename || `Report_${channelName.replace(/\s+/g, "_")}.json`);
        setSuccess("JSON developer payload exported successfully.");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Failed to download report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setError("Please specify a recipient Email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid RFC-compliant email address.");
      return;
    }

    if (typoSuggestion) {
      setError(`Domain typo detected: Did you mean @${typoSuggestion}?`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWarning(null);
      setSuccess(null);

      const response = await resilientFetch("/send/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          channelName: channelName.trim() || "Selected Creator",
          reportType,
          format,
          channelData,
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (resData.status === "unconfigured") {
          setWarning(
            "SMTP credentials in .env are default placeholders. To deliver emails to your inbox, configure your sender Gmail and 16-character App Password in Social_media_analysis/.env. In the meantime, click 'Download Report' to inspect the complete deliverable directly."
          );
        } else {
          throw new Error(resData.error || "Failed to deliver email through SMTP server.");
        }
        return;
      }

      setSuccess(`Report for ${channelName} successfully dispatched to ${email}.`);
    } catch (err) {
      console.error("Email send error:", err);
      setError(err.message || "Email dispatch failed. Verify address and SMTP setup.");
    } finally {
      setLoading(false);
    }
  };

  const previewSubs = channelData?.influencers
    ? channelData.influencers.reduce((acc, cur) => acc + (cur.subscriber_count || 0), 0).toLocaleString()
    : "25,400,000";

  const previewEng = channelData?.influencers
    ? (
        channelData.influencers.reduce((acc, cur) => acc + (cur.engagement_rate || 0), 0) /
        Math.max(1, channelData.influencers.length)
      ).toFixed(1) + "%"
    : "9.4%";

  return (
    <PageWrapper>
      <NavBar />
      <ContentContainer>
        {/* Top Header */}
        <HeaderBanner>
          <div className="title-area">
            <h1>Executive Reports & Delivery Automation</h1>
            <p>Generate, download, and automate scheduled distribution of audit-ready social media analytics.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid #272727",
              color: "#cccccc",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            <Info size={14} color="#FF0000" />
            <span>Export Standards & Specs</span>
          </button>
        </HeaderBanner>

        <MainGrid>
          {/* LEFT: REPORT CONFIGURATOR */}
          <CardPanel>
            <PanelHeader>
              <h2>
                <FileText size={16} color="#FF0000" />
                <span>Export Configuration</span>
              </h2>
              <span className="sub-tag">RFC 5322 Compliant</span>
            </PanelHeader>

            {error && (
              <div style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "6px", padding: "10px 14px", color: "#fca5a5", fontSize: "12px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {warning && (
              <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "6px", padding: "10px 14px", color: "#fde68a", fontSize: "12px", marginBottom: "1rem", lineHeight: "1.4" }}>
                {warning}
              </div>
            )}

            {success && (
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", padding: "10px 14px", color: "#6ee7b7", fontSize: "12px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} />
                <span>{success}</span>
              </div>
            )}

            {/* Target Channel */}
            <FormGroup>
              <label>Target Channel or Creator</label>
              <input
                type="text"
                placeholder="e.g., MrBeast, Linus Tech Tips, CarryMinati..."
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap", fontSize: "11px", color: "#717171" }}>
                <span>Presets:</span>
                {["MrBeast", "CarryMinati", "T-Series"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setChannelName(n); setError(null); }}
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid #272727", color: "#aaaaaa", padding: "2px 6px", borderRadius: "3px", fontSize: "11px", cursor: "pointer" }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </FormGroup>

            {/* Report Type */}
            <FormGroup>
              <label>Analytical Focus</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="Executive Performance Analysis">Executive Performance Analysis</option>
                <option value="Influencer Analysis">Influencer Benchmarking & Verification</option>
                <option value="Sentiment Analysis">Audience Sentiment & Reaction Audit</option>
                <option value="Network Analysis">Collaborative Network & Category Graph</option>
              </select>
            </FormGroup>

            {/* Included Modules */}
            <FormGroup>
              <label>Included Scope Modules</label>
              <ScopeGrid>
                <ScopeChip $active={selectedModules.kpis} onClick={() => toggleModule("kpis")}>
                  <Check size={13} color={selectedModules.kpis ? "#FF0000" : "#717171"} />
                  <span>Performance KPIs</span>
                </ScopeChip>
                <ScopeChip $active={selectedModules.sentiment} onClick={() => toggleModule("sentiment")}>
                  <Check size={13} color={selectedModules.sentiment ? "#FF0000" : "#717171"} />
                  <span>Sentiment Audit</span>
                </ScopeChip>
                <ScopeChip $active={selectedModules.network} onClick={() => toggleModule("network")}>
                  <Check size={13} color={selectedModules.network ? "#FF0000" : "#717171"} />
                  <span>Network Topology</span>
                </ScopeChip>
                <ScopeChip $active={selectedModules.recommendations} onClick={() => toggleModule("recommendations")}>
                  <Check size={13} color={selectedModules.recommendations ? "#FF0000" : "#717171"} />
                  <span>AI Takeaways</span>
                </ScopeChip>
              </ScopeGrid>
            </FormGroup>

            {/* Export Format */}
            <FormGroup>
              <label>Deliverable Output Format</label>
              <FormatSegment>
                <FormatOption $active={format === "pdf"} type="button" onClick={() => setFormat("pdf")}>
                  PDF (Printable)
                </FormatOption>
                <FormatOption $active={format === "csv"} type="button" onClick={() => setFormat("csv")}>
                  CSV (Tabular Data)
                </FormatOption>
                <FormatOption $active={format === "json"} type="button" onClick={() => setFormat("json")}>
                  JSON (Raw API)
                </FormatOption>
              </FormatSegment>
            </FormGroup>

            {/* Recipient Email ID */}
            <FormGroup>
              <label>Recipient Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                  if (warning) setWarning(null);
                }}
              />
              {typoSuggestion && (
                <div style={{ marginTop: "6px", fontSize: "12px", color: "#fde68a" }}>
                  Typo detected: Did you mean <strong>@{typoSuggestion}</strong>?
                </div>
              )}
              <div style={{ fontSize: "11px", color: "#717171", marginTop: "4px" }}>
                Delivered directly to the recipient inbox via authenticated TLS SMTP.
              </div>
            </FormGroup>

            {/* Action Buttons */}
            <ActionRow>
              <ActionBtn
                className="download"
                onClick={handleDownload}
                disabled={loading || !channelName.trim()}
              >
                <Download size={14} />
                <span>{loading ? "Generating..." : "Download File"}</span>
              </ActionBtn>

              <ActionBtn
                className="email"
                onClick={handleSendEmail}
                disabled={loading || !channelName.trim()}
              >
                <Send size={14} />
                <span>{loading ? "Dispatching..." : "Dispatch Email"}</span>
              </ActionBtn>
            </ActionRow>
          </CardPanel>

          {/* RIGHT: DOCUMENT PREVIEW */}
          <CardPanel>
            <PanelHeader>
              <h2>
                <Layers size={16} color="#818cf8" />
                <span>Executive Deliverable Preview</span>
              </h2>
              <span className="sub-tag">Real-Time Canvas</span>
            </PanelHeader>

            <PreviewPaper>
              <div className="doc-header">
                <div>
                  <div className="doc-brand">SMAT Intelligence Dossier</div>
                  <h3 className="doc-title">{channelName || "Channel Identifier"}</h3>
                  <div className="doc-sub">
                    {reportType} &bull; Output: {format.toUpperCase()}
                  </div>
                </div>
                <div className="doc-badge">
                  <div className="badge-label">Channel Tier</div>
                  <div className="badge-grade">Elite Tier</div>
                </div>
              </div>

              {selectedModules.kpis && (
                <div className="preview-grid">
                  <div className="preview-cell">
                    <div className="cell-label">Audience Volume</div>
                    <div className="cell-val" style={{ color: "#FF0000" }}>{previewSubs}</div>
                  </div>
                  <div className="preview-cell">
                    <div className="cell-label">Engagement</div>
                    <div className="cell-val" style={{ color: "#10b981" }}>{previewEng}</div>
                  </div>
                  <div className="preview-cell">
                    <div className="cell-label">Ingested Corpus</div>
                    <div className="cell-val">150 Comments</div>
                  </div>
                  <div className="preview-cell">
                    <div className="cell-label">Authenticity</div>
                    <div className="cell-val" style={{ color: "#818cf8" }}>Verified</div>
                  </div>
                </div>
              )}

              {selectedModules.sentiment && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#181818", borderRadius: "6px", border: "1px solid #272727" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#717171", marginBottom: "6px" }}>
                    Sentiment Perception Audit
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#aaaaaa", lineHeight: "1.5" }}>
                    Multi-video comment analysis classifies the catalog as <strong>Predominantly Positive</strong> (+0.74 VADER compound) across all 15 recent upload nodes.
                  </p>
                </div>
              )}

              {selectedModules.recommendations && (
                <div style={{ marginTop: "0.75rem", padding: "1rem", background: "#181818", borderRadius: "6px", border: "1px solid #272727" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#717171", marginBottom: "6px" }}>
                    Algorithmic Publishing Strategy
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#aaaaaa", lineHeight: "1.5" }}>
                    Publish content during the peak attention velocity slot (Saturday 18:00 UTC) to capture maximum initial 24-hour recommendation momentum.
                  </p>
                </div>
              )}
            </PreviewPaper>
          </CardPanel>
        </MainGrid>
      </ContentContainer>

      {/* Methodology Guide Modal */}
      
    </PageWrapper>
  );
}

export default Reports;
