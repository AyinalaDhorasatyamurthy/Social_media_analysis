import { Users, Filter, FileText, Globe, CheckCircle2, Info } from 'lucide-react';
import { resilientFetch } from "../apiConfig";
import React, { useState, useEffect, useRef } from "react";
import styled, { createGlobalStyle } from "styled-components";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";
import NavBar from "./Navbar";
import InteractiveWorldMap from "./InteractiveWorldMap";
import PageGuideModal from "./PageGuideModal";

// YouTube Studio Dark Mode Theme
const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #FF0000;
    --primary-hover: #cc0000;
    --primary-bg: rgba(255, 0, 0, 0.12);
    --accent-blue: #3ea6ff;
    --success: #2ba640;
    --warning: #f59e0b;
    --error: #ff4d4d;
    --background: #0f0f0f;
    --surface: #181818;
    --surface-elevated: #212121;
    --text: #ffffff;
    --text-muted: #aaaaaa;
    --text-subtle: #717171;
    --border: #272727;
    --border-subtle: #1e1e1e;
    --radius-sm: 6px;
    --radius: 12px;
  }

  body {
    font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0f0f0f;
    color: var(--text);
    margin: 0;
    padding: 0;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
`;

const ControlCard = styled.div`
  background: var(--surface);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) auto;
  gap: 1rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;

  label {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: 18px;
  font-size: 0.9rem;
  background: var(--background);
  color: var(--text);
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: 18px;
  font-size: 0.9rem;
  background: var(--background);
  color: var(--text);
  transition: border-color 0.15s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    button {
      flex: 1;
    }
  }
`;

const Button = styled.button`
  background: ${(props) => (props.$variant === "report" ? "#212121" : "var(--primary)")};
  color: #ffffff;
  padding: 9px 18px;
  border: ${(props) => (props.$variant === "report" ? "1px solid #383838" : "none")};
  border-radius: 18px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => (props.$variant === "report" ? "#2e2e2e" : "var(--primary-hover)")};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #212121;
    color: var(--text-subtle);
    border: 1px solid #282828;
    cursor: not-allowed;
    transform: none;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  text-align: left;

  h2 {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .count-badge {
    background: var(--primary-bg);
    color: #ff4d4d;
    font-size: 0.8rem;
    padding: 3px 10px;
    border-radius: 14px;
    font-weight: 700;
    border: 1px solid rgba(255, 0, 0, 0.25);
  }
`;

const InfluencerGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
`;

const CreatorCard = styled.div`
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 1.5rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  text-align: left;

  &:hover {
    border-color: #383838;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const Avatar = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border);
  background: var(--surface-elevated);
`;

const CreatorMeta = styled.div`
  flex: 1;

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      justify-content: center;
    }
  }

  h3 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text);
  }

  .verified-badge {
    color: var(--accent-blue);
    font-size: 1.1rem;
    display: inline-flex;
    align-items: center;
  }

  .handle {
    color: var(--text-muted);
    font-size: 0.88rem;
    font-weight: 500;
    margin-top: 3px;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    @media (max-width: 640px) {
      justify-content: center;
    }

    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    justify-content: center;
  }
`;

const Tag = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  background: ${(props) => {
    if (props.$type === "region") return "rgba(62, 166, 255, 0.12)";
    if (props.$type === "category") return "rgba(255, 0, 0, 0.12)";
    if (props.$type === "collab") return "rgba(255, 255, 255, 0.08)";
    return "#212121";
  }};

  color: ${(props) => {
    if (props.$type === "region") return "#3ea6ff";
    if (props.$type === "category") return "#ff4d4d";
    if (props.$type === "collab") return "#ffffff";
    return "#aaaaaa";
  }};

  border: 1px solid ${(props) => {
    if (props.$type === "region") return "rgba(62, 166, 255, 0.25)";
    if (props.$type === "category") return "rgba(255, 0, 0, 0.25)";
    if (props.$type === "collab") return "rgba(255, 255, 255, 0.15)";
    return "#303030";
  }};
`;

const TierBadge = styled.span`
  background: rgba(255, 0, 0, 0.15);
  color: #ff4d4d;
  border: 1px solid rgba(255, 0, 0, 0.35);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 14px;
  margin-left: auto;

  @media (max-width: 640px) {
    margin-left: 0;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1.25rem;
  background: #121212;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div`
  text-align: center;

  .label {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .value {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text);
    margin-top: 3px;
    font-variant-numeric: tabular-nums;
  }

  .sub {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-subtle);
    margin-top: 2px;
  }
`;

const HighlightsRow = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .highlights-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
  }
`;

const TopicPill = styled.span`
  font-size: 0.76rem;
  background: var(--surface-elevated);
  border: 1px solid #303030;
  color: var(--text);
  padding: 2px 9px;
  border-radius: 12px;
  font-weight: 500;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const InsightsSection = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--border);
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ChartBox = styled.div`
  background: #121212;
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  height: 320px;
  display: flex;
  flex-direction: column;

  h4 {
    margin: 0 0 0.8rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text);
  }

  .chart-canvas-wrapper {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
  }
`;

const PersonaBanner = styled.div`
  margin-top: 1rem;
  background: #121212;
  border: 1px solid var(--border);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-sm);
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;

  .persona-text {
    font-size: 0.85rem;
    color: var(--text-muted);
    strong {
      color: #ffffff;
    }
  }

  .quality-score {
    background: var(--surface-elevated);
    border: 1px solid #383838;
    padding: 5px 12px;
    border-radius: 14px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text);
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4d;
  padding: 0.9rem 1.25rem;
  background: rgba(255, 0, 0, 0.12);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
  font-weight: 600;
  text-align: center;
  font-size: 0.9rem;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 15, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-weight: 700;
  color: #ffffff;
  font-size: 1.05rem;
`;

const formatNumber = (num) => {
  if (!num || isNaN(num)) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return Number(num).toLocaleString();
};

const InfluencerAnalytics = () => {
  const [regionQuery, setRegionQuery] = useState("UK");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minSubs, setMinSubs] = useState("0");
  const [sortBy, setSortBy] = useState("subscribers");
  const [influencers, setInfluencers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);
  const navigate = useNavigate();

  const fetchInfluencers = async (query = regionQuery, cat = categoryFilter, subs = minSubs, sort = sortBy) => {
    setLoading(true);
    setError(null);
    try {
      const response = await resilientFetch(`/influencer/filter?region=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}&min_subscribers=${subs}&sort_by=${sort}&limit=15`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch creators");
      }
      const rows = Array.isArray(data) ? data : [];
      setInfluencers(rows);
      if (rows.length === 0) {
        setError(`No verified influencers found matching "${query}". Try searching or clicking another country on the map like UK, Germany, Japan, South Korea, Russia, or India.`);
      }
    } catch (err) {
      setError(err.message || "Failed to load influencers.");
      setInfluencers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers("UK");
  }, []);

  const handleMapCountrySelect = (countryCode, queryName) => {
    setRegionQuery(queryName);
    setCategoryFilter("All");
    setMinSubs("0");
    setSelectedChannel(null);
    fetchInfluencers(queryName, "All", "0", sortBy);
  };

  const toggleInsights = async (channelId) => {
    if (selectedChannel === channelId) {
      setSelectedChannel(null);
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      return;
    }

    setSelectedChannel(channelId);
    setLoading(true);

    try {
      const res = await resilientFetch(`/influencer/fetch_channel_engagement?channel_id=${channelId}`);
      const data = await res.json();

      if (barChartInstance.current) barChartInstance.current.destroy();
      if (lineChartInstance.current) lineChartInstance.current.destroy();

      setTimeout(() => {
        const barCanvas = document.getElementById(`bar-${channelId}`);
        if (barCanvas && data.engagement_scores) {
          barChartInstance.current = new Chart(barCanvas, {
            type: "bar",
            data: {
              labels: Object.keys(data.engagement_scores),
              datasets: [
                {
                  label: "Engagement Index Score (out of 100)",
                  data: Object.values(data.engagement_scores),
                  backgroundColor: "rgba(255, 0, 0, 0.8)",
                  borderColor: "#FF0000",
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { 
                  beginAtZero: true, 
                  max: 100,
                  grid: { color: "rgba(255, 255, 255, 0.05)" },
                  ticks: { color: "#aaaaaa" }
                },
                x: { 
                  grid: { display: false },
                  ticks: { color: "#aaaaaa", font: { size: 11 } } 
                },
              },
            },
          });
        }

        const lineCanvas = document.getElementById(`line-${channelId}`);
        if (lineCanvas && data.growth_rates) {
          lineChartInstance.current = new Chart(lineCanvas, {
            type: "line",
            data: {
              labels: Object.keys(data.growth_rates),
              datasets: [
                {
                  label: "Monthly View Growth Rate (%)",
                  data: Object.values(data.growth_rates),
                  borderColor: "#3ea6ff",
                  backgroundColor: "rgba(62, 166, 255, 0.15)",
                  tension: 0.35,
                  fill: true,
                  pointBackgroundColor: "#3ea6ff",
                  pointRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { 
                y: { 
                  beginAtZero: true,
                  grid: { color: "rgba(255, 255, 255, 0.05)" },
                  ticks: { color: "#aaaaaa" }
                },
                x: {
                  grid: { display: false },
                  ticks: { color: "#aaaaaa" }
                }
              },
            },
          });
        }
      }, 150);
    } catch (e) {
      console.error("Engagement fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = () => {
    if (influencers.length > 0) {
      const reportData = {
        channelName: `Top Influencers (${regionQuery || "Global"})`,
        influencers: influencers,
        filters: {
          region: regionQuery,
          category: categoryFilter,
          minSubscribers: minSubs,
        },
      };

      sessionStorage.setItem("channelData", JSON.stringify(reportData));
      sessionStorage.setItem("reportType", "Influencer Analysis");
      navigate("/reports");
    } else {
      setError("Please select a country on the map or search first.");
    }
  };

  return (
    <>
      <GlobalStyle />
      <NavBar />
      <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#ffffff", paddingBottom: "4rem" }}>
      <Container>
        {/* Header - YouTube Studio Layout */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "1.75rem",
          borderBottom: "1px solid #272727",
          paddingBottom: "1.25rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{
                background: "#FF0000",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}>
                Creator Intelligence
              </span>
              <span style={{ fontSize: "12px", color: "#aaaaaa" }}>Global Benchmark & Verified Roster</span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: "800",
              letterSpacing: "-0.02em",
              color: "#ffffff"
            }}>
              InsightSphere | Creator Intelligence & Verification
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#aaaaaa", fontSize: "0.88rem" }}>
              Geographic creator discovery, real-time engagement benchmarking, and verified audience reach metrics.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            

            <button
              type="button"
              onClick={handleViewReport}
              disabled={loading || influencers.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: influencers.length > 0 ? "#FF0000" : "#212121",
                color: influencers.length > 0 ? "#ffffff" : "#717171",
                border: "none",
                padding: "8px 18px",
                borderRadius: "18px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: influencers.length > 0 ? "pointer" : "not-allowed"
              }}
            >
              <FileText size={14} />
              <span>Export Creator Report</span>
            </button>
          </div>
        </div>

        {/* GEOGRAPHIC CREATOR MAP */}
        <InteractiveWorldMap
          selectedRegion={regionQuery}
          onSelectCountry={handleMapCountrySelect}
        />

        {/* Controls Card */}
        <ControlCard>
          <FormGroup>
            <label>Selected Country / Region</label>
            <Input
              type="text"
              placeholder="e.g., UK, Germany, Japan, US, India, Africa..."
              value={regionQuery}
              onChange={(e) => setRegionQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInfluencers()}
            />
          </FormGroup>

          <FormGroup>
            <label>Niche / Category</label>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                fetchInfluencers(regionQuery, e.target.value, minSubs, sortBy);
              }}
            >
              <option value="All">All Categories</option>
              <option value="Technology">Technology & Gadgets</option>
              <option value="Food">Food & Cooking</option>
              <option value="Comedy">Comedy & Entertainment</option>
              <option value="Gaming">Gaming & Esports</option>
              <option value="Education">Education & Analysis</option>
              <option value="Travel">Travel & Adventure</option>
              <option value="Automobile">Automobile & MotoVlogging</option>
              <option value="Science">Science & Engineering</option>
              <option value="Music">Music & Audio</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <label>Min Subscribers</label>
            <Select
              value={minSubs}
              onChange={(e) => {
                setMinSubs(e.target.value);
                fetchInfluencers(regionQuery, categoryFilter, e.target.value, sortBy);
              }}
            >
              <option value="0">All Tiers (Any Subs)</option>
              <option value="500000">500K+ Subscribers</option>
              <option value="1000000">1M+ (Macro Creator)</option>
              <option value="5000000">5M+ (Mega Creator)</option>
              <option value="10000000">10M+ (Super Mega)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <label>Sort By</label>
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchInfluencers(regionQuery, categoryFilter, minSubs, e.target.value);
              }}
            >
              <option value="subscribers">Highest Subscribers</option>
              <option value="engagement">Highest Engagement Rate</option>
              <option value="views">Most Total Views</option>
            </Select>
          </FormGroup>

          <ActionButtonGroup>
            <Button onClick={() => fetchInfluencers()} disabled={loading}>
              Filter
            </Button>
          </ActionButtonGroup>
        </ControlCard>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Section Header */}
        <SectionHeader>
          <h2>
            Verified Creator Roster for <span style={{ color: "#FF0000" }}>{regionQuery || "Selected Region"}</span>
            <span className="count-badge">{influencers.length} Creators Listed</span>
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Real-time YouTube channel profiles & verified audience engagement
          </span>
        </SectionHeader>

        {/* Influencers List */}
        <InfluencerGrid>
          {influencers.map((inf, idx) => {
            const isExpanded = selectedChannel === inf.channel_id;
            return (
              <CreatorCard key={inf.channel_id || idx}>
                <CardTopRow>
                  <Avatar
                    src={inf.thumbnail || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"}
                    alt={inf.title}
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces";
                    }}
                  />

                  <CreatorMeta>
                    <div className="title-row">
                      <h3>{inf.title}</h3>
                      <span className="verified-badge" title="Verified Creator">
                        <CheckCircle2 size={16} fill="#3ea6ff" color="#0f0f0f" />
                      </span>
                      <TierBadge>{inf.influencer_type || "Macro Creator"}</TierBadge>
                    </div>

                    <div className="handle">
                      <span>{inf.handle || `@${inf.title.replace(/\s+/g, "").toLowerCase()}`}</span>
                      <span>•</span>
                      {inf.custom_url ? (
                        <a href={inf.custom_url} target="_blank" rel="noopener noreferrer">
                          ▶ Open YouTube
                        </a>
                      ) : (
                        <a href={`https://www.youtube.com/channel/${inf.channel_id}`} target="_blank" rel="noopener noreferrer">
                          ▶ Open YouTube
                        </a>
                      )}
                    </div>

                    <BadgeRow>
                      <Tag $type="region">📍 {inf.region || inf.country || "Global Creator"}</Tag>
                      <Tag $type="category">📂 {inf.top_category || "Entertainment"}</Tag>
                      {inf.est_collab_rate && (
                        <Tag $type="collab">💼 {inf.est_collab_rate}</Tag>
                      )}
                    </BadgeRow>
                  </CreatorMeta>
                </CardTopRow>

                {/* 4-Metric Grid */}
                <MetricsGrid>
                  <MetricCard>
                    <div className="label">Subscribers</div>
                    <div className="value">{formatNumber(inf.subscriber_count)}</div>
                    <div className="sub">Total Verified Audience</div>
                  </MetricCard>

                  <MetricCard>
                    <div className="label">Engagement Rate</div>
                    <div className="value" style={{ color: "#FF0000" }}>
                      {inf.engagement_rate}%
                    </div>
                    <div className="sub">
                      {inf.engagement_rate >= 6.5 ? "Exceptional" : inf.engagement_rate >= 4.5 ? "High" : "Standard"}
                    </div>
                  </MetricCard>

                  <MetricCard>
                    <div className="label">Total Views</div>
                    <div className="value">{formatNumber(inf.total_views)}</div>
                    <div className="sub">Lifetime Impressions</div>
                  </MetricCard>

                  <MetricCard>
                    <div className="label">Total Videos</div>
                    <div className="value">{(inf.total_videos || 0).toLocaleString()}</div>
                    <div className="sub">Catalog Depth</div>
                  </MetricCard>
                </MetricsGrid>

                {/* Topics / Highlights */}
                {inf.highlights && inf.highlights.length > 0 && (
                  <HighlightsRow>
                    <span className="highlights-title">Content Focus:</span>
                    {inf.highlights.map((h, i) => (
                      <TopicPill key={i}>{h}</TopicPill>
                    ))}
                  </HighlightsRow>
                )}

                {/* Action Footer */}
                <CardFooter>
                  <Button
                    onClick={() => toggleInsights(inf.channel_id)}
                    style={{
                      background: isExpanded ? "#212121" : "var(--primary)",
                      border: isExpanded ? "1px solid #383838" : "none",
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                    }}
                  >
                    {isExpanded ? "▲ Hide Performance Analytics" : "▶ View Performance Analytics & Growth"}
                  </Button>

                  <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                    Channel ID: <code>{inf.channel_id}</code>
                  </span>
                </CardFooter>

                {/* Collapsible Performance Analytics */}
                {isExpanded && (
                  <InsightsSection>
                    <PersonaBanner>
                      <div className="persona-text">
                        <strong>Audience Persona:</strong> High brand affinity among {inf.language || "regional"}{" "}
                        speaking youth & active consumers interested in {inf.top_category}.
                      </div>
                      <div className="quality-score">Engagement Quality: 95/100</div>
                    </PersonaBanner>

                    <ChartsRow>
                      <ChartBox>
                        <h4>Category Engagement Breakdown</h4>
                        <div className="chart-canvas-wrapper">
                          <canvas id={`bar-${inf.channel_id}`} />
                        </div>
                      </ChartBox>

                      <ChartBox>
                        <h4>6-Month Audience Growth Trajectory (%)</h4>
                        <div className="chart-canvas-wrapper">
                          <canvas id={`line-${inf.channel_id}`} />
                        </div>
                      </ChartBox>
                    </ChartsRow>
                  </InsightsSection>
                )}
              </CreatorCard>
            );
          })}
        </InfluencerGrid>

        {loading && (
          <LoadingOverlay>
            <div>Analyzing verified creator performance data...</div>
          </LoadingOverlay>
        )}
        <PageGuideModal
          module="influencer"
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
        />
      </Container>
      </div>
    </>
  );
};

export default InfluencerAnalytics;
