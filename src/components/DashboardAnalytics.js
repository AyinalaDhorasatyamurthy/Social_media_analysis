import React, { useState, useEffect } from "react";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Title, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { 
  TrendingUp, 
  Flame, 
  Eye, 
  ThumbsUp, 
  Calendar, 
  Globe, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  BarChart3, 
  Layers 
} from "lucide-react";
import NavBar from "./Navbar";
import { resilientFetch } from "../apiConfig";

// Register Chart.js components
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Title, Legend);

// Global Chart settings for YouTube Dark Theme
Chart.defaults.color = "#aaaaaa";
Chart.defaults.borderColor = "rgba(255, 255, 255, 0.08)";
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const COUNTRIES = [
  { code: "IN", label: "India", flag: "🇮🇳" },
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "KR", label: "South Korea", flag: "🇰🇷" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "BR", label: "Brazil", flag: "🇧🇷" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
];

const DashboardAnalytics = () => {
  const [region, setRegion] = useState("IN");
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [wordCloudUrl, setWordCloudUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'table'

  const fetchData = async (selectedRegion) => {
    setLoading(true);
    setError(null);
    setTrendingVideos([]);
    setWordCloudUrl("");

    try {
      // 1. Fetch Trending Videos via resilientFetch
      const response = await resilientFetch(`/dash/get_trending_data?region=${encodeURIComponent(selectedRegion)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to fetch trending videos.");
      }

      const videosList = Array.isArray(data.videos) ? data.videos : [];
      if (videosList.length === 0) {
        throw new Error(`No trending videos returned for region ${selectedRegion}.`);
      }

      setTrendingVideos(videosList);
      setLoading(false);

      // 2. Fetch Wordcloud asynchronously in parallel (non-blocking)
      fetchWordcloud(selectedRegion);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load trending data from backend.");
      setLoading(false);
    }
  };

  const fetchWordcloud = async (selectedRegion) => {
    setCloudLoading(true);
    try {
      const cloudRes = await resilientFetch(`/dash/wordcloud?region=${encodeURIComponent(selectedRegion)}`);
      const cloudData = await cloudRes.json().catch(() => ({}));
      if (cloudRes.ok && cloudData.wordcloud) {
        setWordCloudUrl(cloudData.wordcloud);
      }
    } catch (e) {
      console.warn("Wordcloud fetch failed:", e);
    } finally {
      setCloudLoading(false);
    }
  };

  useEffect(() => {
    fetchData(region);
  }, [region]);

  const topVideos = trendingVideos.slice(0, 10);

  // Calculate high-level KPIs
  const totalViews = trendingVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
  const avgViews = trendingVideos.length > 0 ? Math.round(totalViews / trendingVideos.length) : 0;
  const topVideo = trendingVideos[0] || null;

  const formatViews = (num) => {
    if (!num || isNaN(num)) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
  };

  // Chart data with authentic YouTube Red accents
  const chartData = {
    labels: topVideos.map(v => (v.title || "Video").substring(0, 18) + "..."),
    datasets: [{
      label: "View Count",
      data: topVideos.map(v => Number(v.views) || 0),
      backgroundColor: "rgba(255, 0, 0, 0.75)",
      hoverBackgroundColor: "#FF0000",
      borderColor: "#FF0000",
      borderWidth: 1,
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#212121",
        titleColor: "#ffffff",
        bodyColor: "#aaaaaa",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` Views: ${Number(ctx.parsed.y).toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { 
          color: "#aaaaaa",
          callback: (val) => formatViews(val)
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#aaaaaa", maxRotation: 30 }
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "#ffffff",
      fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: "5rem"
    }}>
      <NavBar />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* YouTube Studio Styled Header */}
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
                Trending Live
              </span>
              <span style={{ fontSize: "12px", color: "#aaaaaa" }}>Real-time Regional Feed</span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "1.85rem",
              fontWeight: "800",
              color: "#ffffff",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span>YouTube Trending Intelligence</span>
            </h1>
            <p style={{ margin: "6px 0 0 0", color: "#aaaaaa", fontSize: "0.92rem" }}>
              Real-time viral video velocity, view counts, audience interaction rates, and semantic topic clusters across global regions.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: "flex", background: "#212121", padding: "3px", borderRadius: "8px", border: "1px solid #2e2e2e" }}>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              style={{
                background: viewMode === "cards" ? "#FF0000" : "transparent",
                color: viewMode === "cards" ? "#ffffff" : "#aaaaaa",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              16:9 Cards View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                background: viewMode === "table" ? "#FF0000" : "transparent",
                color: viewMode === "table" ? "#ffffff" : "#aaaaaa",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Rank Table View
            </button>
          </div>
        </div>

        {/* YouTube-Style Horizontal Country Filter Chips Carousel */}
        <div style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "1.75rem",
          scrollbarWidth: "none"
        }}>
          {COUNTRIES.map((c) => {
            const isActive = region === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setRegion(c.code)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isActive ? "1px solid #FF0000" : "1px solid #272727",
                  background: isActive ? "#FF0000" : "#212121",
                  color: "#ffffff",
                  boxShadow: isActive ? "0 0 12px rgba(255, 0, 0, 0.4)" : "none"
                }}
              >
                <span>{c.flag}</span>
                <span>{c.label} ({c.code})</span>
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            background: "rgba(255, 0, 0, 0.1)",
            border: "1px solid #FF0000",
            borderRadius: "8px",
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
            color: "#ff6b6b",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <div>
              <strong>Failed to load region feed:</strong> {error}
              <div style={{ fontSize: "12px", color: "#aaaaaa", marginTop: "4px" }}>
                Ensure Flask backend is running on port 5000 and has valid YouTube API quota.
              </div>
            </div>
            <button
              onClick={() => fetchData(region)}
              style={{
                marginLeft: "auto",
                background: "#FF0000",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px"
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "#181818",
            border: "1px solid #272727",
            borderRadius: "12px",
            marginBottom: "2rem"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(255, 0, 0, 0.2)",
              borderTopColor: "#FF0000",
              borderRadius: "50%",
              margin: "0 auto 1rem auto",
              animation: "spin 0.8s linear infinite"
            }} />
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
              Loading trending videos for {region}...
            </div>
            <div style={{ fontSize: "13px", color: "#aaaaaa", marginTop: "6px" }}>
              Streaming real-time view counts, metadata, and audience engagement statistics.
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !error && trendingVideos.length > 0 && (
          <>
            {/* 4 YouTube Studio KPI Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaaaaa", fontSize: "12px", fontWeight: "500" }}>
                  <span>Cumulative Trending Views</span>
                  <Eye size={15} color="#FF0000" />
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginTop: "6px" }}>
                  {formatViews(totalViews)}
                </div>
                <div style={{ fontSize: "11px", color: "#717171", marginTop: "4px" }}>
                  Across top {trendingVideos.length} trending videos
                </div>
              </div>

              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaaaaa", fontSize: "12px", fontWeight: "500" }}>
                  <span>#1 Ranked Trending Title</span>
                  <Flame size={15} color="#FF0000" />
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff", marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {topVideo?.title || "N/A"}
                </div>
                <div style={{ fontSize: "11px", color: "#3ea6ff", marginTop: "4px" }}>
                  {formatViews(topVideo?.views)} views &bull; {topVideo?.channel_title}
                </div>
              </div>

              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaaaaa", fontSize: "12px", fontWeight: "500" }}>
                  <span>Average Video Reach</span>
                  <TrendingUp size={15} color="#10b981" />
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>
                  {formatViews(avgViews)}
                </div>
                <div style={{ fontSize: "11px", color: "#717171", marginTop: "4px" }}>
                  Mean impressions per viral upload
                </div>
              </div>

              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaaaaa", fontSize: "12px", fontWeight: "500" }}>
                  <span>Active Geographic Market</span>
                  <Globe size={15} color="#3ea6ff" />
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#3ea6ff", marginTop: "6px" }}>
                  {region} Feed
                </div>
                <div style={{ fontSize: "11px", color: "#717171", marginTop: "4px" }}>
                  ISO 3166-1 alpha-2 region target
                </div>
              </div>
            </div>

            {/* Top 10 Views Chart Section */}
            <div style={{
              background: "#181818",
              border: "1px solid #272727",
              borderRadius: "10px",
              padding: "1.5rem",
              marginBottom: "2rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
                    Top 10 Viral Videos by View Velocity ({region})
                  </h3>
                  <div style={{ fontSize: "12px", color: "#aaaaaa" }}>Real-time playback counts extracted directly from YouTube servers</div>
                </div>
                <span style={{ fontSize: "11px", background: "#212121", padding: "3px 10px", borderRadius: "12px", color: "#aaaaaa", border: "1px solid #2e2e2e" }}>
                  YouTube Studio Chart
                </span>
              </div>
              <div style={{ height: "300px" }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* 16:9 Video Cards View OR Table View */}
            {viewMode === "cards" ? (
              <div style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                    Top Trending Feed Roster ({trendingVideos.length} Videos)
                  </h2>
                  <span style={{ fontSize: "12px", color: "#aaaaaa" }}>Ranked #1 to #{trendingVideos.length}</span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: "1.25rem"
                }}>
                  {trendingVideos.map((video, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    return (
                      <div
                        key={index}
                        style={{
                          background: "#181818",
                          border: "1px solid #272727",
                          borderRadius: "10px",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          transition: "transform 0.2s ease, border-color 0.2s ease",
                        }}
                      >
                        {/* 16:9 Thumbnail with Rank Badge Overlay */}
                        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#000000" }}>
                          <img
                            src={video.thumbnail || "https://i.ytimg.com/vi/nCa4BGy3MJ8/hqdefault.jpg"}
                            alt={video.title}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";
                            }}
                          />
                          {/* Rank Badge */}
                          <div style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            background: isTop3 ? "#FF0000" : "rgba(0, 0, 0, 0.8)",
                            color: "#ffffff",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "800",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.5)"
                          }}>
                            #{rank} {rank === 1 ? "🔥 TOP" : ""}
                          </div>

                          {/* Views Badge */}
                          <div style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            background: "rgba(0, 0, 0, 0.85)",
                            color: "#ffffff",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            {formatViews(video.views)}
                          </div>
                        </div>

                        {/* Video Metadata */}
                        <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <h4 style={{
                              margin: "0 0 6px 0",
                              fontSize: "13px",
                              fontWeight: "700",
                              color: "#ffffff",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}>
                              {video.title}
                            </h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#aaaaaa", marginBottom: "6px" }}>
                              <span>{video.channel_title}</span>
                              <CheckCircle2 size={12} color="#aaaaaa" />
                            </div>
                          </div>

                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "#717171",
                            borderTop: "1px solid #272727",
                            paddingTop: "8px"
                          }}>
                            <span>👍 {video.likes !== "N/A" ? formatViews(video.likes) : "N/A"}</span>
                            <span>{video.published_at ? new Date(video.published_at).toLocaleDateString() : ""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Table View */
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem",
                marginBottom: "2.5rem",
                overflowX: "auto"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#212121", borderBottom: "1px solid #2e2e2e" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#aaaaaa" }}>Rank</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#aaaaaa" }}>Video Title</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#aaaaaa" }}>Channel</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#aaaaaa" }}>Views</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#aaaaaa" }}>Likes</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#aaaaaa" }}>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendingVideos.map((video, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #272727" }}>
                        <td style={{ padding: "10px 14px", fontWeight: "800", color: idx < 3 ? "#FF0000" : "#aaaaaa" }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#ffffff", fontWeight: "600", maxWidth: "380px" }}>
                          {video.title}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#3ea6ff" }}>
                          {video.channel_title}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#ffffff", fontWeight: "700" }}>
                          {Number(video.views).toLocaleString()}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#10b981" }}>
                          {video.likes !== "N/A" ? Number(video.likes).toLocaleString() : "N/A"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#717171" }}>
                          {video.published_at ? new Date(video.published_at).toLocaleDateString() : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Trending Keywords Wordcloud Section */}
            {wordCloudUrl && (
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.5rem",
                marginBottom: "2rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
                      Trending Semantic Keyword Cloud ({region})
                    </h3>
                    <div style={{ fontSize: "12px", color: "#aaaaaa" }}>Natural language term density extracted from trending video titles</div>
                  </div>
                  <span style={{ fontSize: "11px", background: "#212121", padding: "3px 10px", borderRadius: "12px", color: "#aaaaaa" }}>
                    NLP Extraction
                  </span>
                </div>
                <div style={{ textAlign: "center", background: "#0a0a0a", borderRadius: "8px", padding: "1rem", border: "1px solid #222" }}>
                  <img
                    src={wordCloudUrl}
                    alt={`Trending Keywords Wordcloud for ${region}`}
                    style={{ maxWidth: "100%", height: "auto", borderRadius: "6px" }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardAnalytics;
