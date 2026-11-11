import React, { useState, useEffect, useCallback, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  FileText 
} from "lucide-react";
import NavBar from "./Navbar";

import { resilientFetch } from "../apiConfig";

Chart.register(...registerables);

// Chart YouTube Dark Theme defaults
Chart.defaults.color = "#aaaaaa";
Chart.defaults.borderColor = "rgba(255, 255, 255, 0.08)";
Chart.defaults.font.family = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const YouTubeAnalytics = () => {
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState("--");
  const [views, setViews] = useState("--");
  const [videos, setVideos] = useState("--");
  const [categoryLabel, setCategoryLabel] = useState("--");
  const [channelData, setChannelData] = useState(null);
  const [autoScopeViews, setAutoScopeViews] = useState(true);
  const [autoScopeClusters, setAutoScopeClusters] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const chartsRef = useRef({});
  const navigate = useNavigate();

  const fetchData = async (targetChannel) => {
    const query = (targetChannel || channelName).trim();
    if (!query) {
      alert("Please enter a valid channel name.");
      return;
    }

    setLoading(true);

    try {
      const analyticsResponse = await resilientFetch("/network/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_name: query }),
      });
      const analyticsPayload = await analyticsResponse.json().catch(() => ({}));
      if (!analyticsResponse.ok) {
        throw new Error(analyticsPayload.error || "Error fetching channel topology.");
      }

      const contentResponse = await resilientFetch("/network/content_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_name: query }),
      });
      const contentPayload = await contentResponse.json().catch(() => ({}));
      if (!contentResponse.ok) {
        throw new Error(contentPayload.error || "Error fetching content analysis.");
      }

      const analyticsData = analyticsPayload;
      const contentData = contentPayload;

      setLoading(false);

      if (analyticsData.error) {
        alert(analyticsData.error);
        return;
      }

      setSubscribers(analyticsData.subscribers);
      setViews(analyticsData.views);
      setVideos(analyticsData.total_videos);

      if (analyticsData.videos && analyticsData.videos.length > 0) {
        setSelectedVideo({ ...analyticsData.videos[0], index: 0 });
      }

      if (contentData.category_analysis && Object.keys(contentData.category_analysis).length > 0) {
        const mostFrequent = Object.keys(contentData.category_analysis).reduce((a, b) =>
          contentData.category_analysis[a] > contentData.category_analysis[b] ? a : b
        );
        setCategoryLabel(mostFrequent);
      }

      setChannelData({
        channelName: query,
        analytics: analyticsData,
        content: contentData
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(error.message || "Error fetching data from server.");
      setLoading(false);
    }
  };

  const handleViewReport = () => {
    if (!channelData) return;
    const reportData = {
      channel_name: channelData.channelName,
      subscribers: subscribers,
      views: views,
      total_videos: videos,
      dominant_category: categoryLabel,
      videos: channelData.analytics?.videos || [],
      keyword_analysis: channelData.analytics?.keyword_analysis || [],
      duration_analysis: channelData.content?.duration_analysis || [],
      category_analysis: channelData.content?.category_analysis || {},
      generated_at: new Date().toISOString(),
      report_type: "Network & Content Topology Audit"
    };

    try {
      localStorage.setItem("smat_latest_report", JSON.stringify(reportData));
      localStorage.setItem("smat_selected_channel", channelData.channelName);
      sessionStorage.setItem("smat_latest_report", JSON.stringify(reportData));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }

    navigate("/reports", { state: { report: reportData } });
  };

  const renderCharts = useCallback((videoData, keywordData, durationData, categoryData) => {
    Object.values(chartsRef.current).forEach(chart => chart?.destroy());
    chartsRef.current = {};

    // 1. Views Chronology Bar Chart (YouTube Red) with Dynamic Auto-Scope
    const viewsCtx = document.getElementById("viewsChart");
    if (viewsCtx && videoData.length > 0) {
      const viewsList = videoData.map(v => Number(v.views) || 0);
      const nonZeroViews = viewsList.filter(v => v > 0);
      const minNonZero = nonZeroViews.length > 0 ? Math.min(...nonZeroViews) : 1000;
      const maxViews = viewsList.length > 0 ? Math.max(...viewsList) : 1000000;
      // Generous floor ensures smallest video has noticeable baseline bar height
      const logFloor = Math.max(10, Math.floor(minNonZero * 0.25));

      const sortedByViews = [...videoData].map((v, i) => ({ i, views: Number(v.views) || 0 }))
        .sort((a, b) => b.views - a.views);
      const rankMap = {};
      sortedByViews.forEach((item, rank) => { rankMap[item.i] = rank + 1; });

      chartsRef.current.viewsChart = new Chart(viewsCtx, {
        type: "bar",
        data: {
          labels: videoData.map((_, i) => `#${i + 1}`),
          datasets: [{
            label: "Video Views",
            data: videoData.map(v => {
              const raw = Number(v.views) || 0;
              return autoScopeViews ? Math.max(logFloor * 1.5, raw) : raw;
            }),
            minBarLength: 26,
            backgroundColor: videoData.map(v => (
              (Number(v.views) || 0) === maxViews 
                ? "rgba(255, 0, 0, 0.95)" 
                : "rgba(255, 0, 0, 0.72)"
            )),
            hoverBackgroundColor: "#FF0000",
            borderColor: "#FF0000",
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false
          },
          onHover: (event, activeElements) => {
            if (activeElements && activeElements.length > 0) {
              const idx = activeElements[0].index;
              if (videoData[idx]) {
                setSelectedVideo({ ...videoData[idx], index: idx, rank: rankMap[idx] });
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1e1e1e",
              titleColor: "#ffffff",
              titleFont: { weight: "700", size: 12 },
              bodyColor: "#cccccc",
              bodyFont: { size: 11 },
              borderColor: "rgba(255, 255, 255, 0.15)",
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                title: (items) => {
                  const idx = items[0].dataIndex;
                  const v = videoData[idx];
                  return v?.title ? `${v.title}` : `Video #${idx + 1}`;
                },
                label: (ctx) => {
                  const idx = ctx.dataIndex;
                  const raw = Number(videoData[idx]?.views) || 0;
                  const likes = Number(videoData[idx]?.likes) || 0;
                  return [
                    ` Views: ${raw.toLocaleString()} impressions`,
                    ` Likes: ${likes.toLocaleString()}`,
                    ` Snapshot Rank: #${rankMap[idx]} of ${videoData.length}`,
                    autoScopeViews ? ` Auto-Scope: All 15 elevated & cursor-hoverable` : ` Scale: Standard Linear`
                  ];
                }
              }
            }
          },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { color: "#aaaaaa", font: { weight: "600" } } 
            },
            y: { 
              type: autoScopeViews ? "logarithmic" : "linear",
              min: autoScopeViews ? logFloor : 0,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { 
                color: "#aaaaaa",
                font: { size: 10 },
                callback: (v) => {
                  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
                  if (v >= 1e6) return (v / 1e6).toFixed(0) + "M";
                  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
                  if (v >= 1) return v;
                  return "";
                }
              },
              title: {
                display: true,
                text: autoScopeViews ? "Views (Auto-Scoped Log Scale)" : "Views (Linear Scale)",
                color: "#717171",
                font: { size: 10, weight: "600" }
              }
            }
          }
        }
      });
    }

    // 2. Keyword TF-IDF Horizontal Bar Chart (YouTube Blue Accent)
    const keywordCtx = document.getElementById("keywordChart");
    if (keywordCtx && keywordData.length > 0) {
      chartsRef.current.keywordChart = new Chart(keywordCtx, {
        type: "bar",
        indexAxis: "y",
        data: {
          labels: keywordData.map(k => k.keyword),
          datasets: [{
            label: "TF-IDF Weight",
            data: keywordData.map(k => (
              k.frequency !== undefined ? k.frequency : (k.count !== undefined ? k.count : (k.weight || 0))
            )),
            backgroundColor: "rgba(62, 166, 255, 0.8)",
            hoverBackgroundColor: "#3ea6ff",
            borderColor: "#3ea6ff",
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "nearest",
            intersect: false
          },
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: "#212121",
              titleColor: "#ffffff",
              bodyColor: "#aaaaaa",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 1,
              callbacks: {
                label: (ctx) => ` TF-IDF Score: ${Number(ctx.parsed.x).toFixed(2)}`
              }
            }
          },
          scales: {
            x: { 
              grid: { color: "rgba(255, 255, 255, 0.05)" }, 
              ticks: { color: "#aaaaaa" },
              title: { display: true, text: "TF-IDF Weight Score", color: "#aaaaaa", font: { size: 10 } }
            },
            y: { grid: { display: false }, ticks: { color: "#ffffff", font: { weight: "500" } } }
          }
        }
      });
    }

    // 3. Views vs Likes Scatter (Engagement Cluster) with Auto-Scope
    const clusterCtx = document.getElementById("clusterChart");
    if (clusterCtx && videoData.length > 0) {
      const viewsList = videoData.map(v => Number(v.views) || 0);
      const likesList = videoData.map(v => Number(v.likes) || 0);
      const nonZeroV = viewsList.filter(v => v > 0);
      const nonZeroL = likesList.filter(l => l > 0);
      const minNonZeroV = nonZeroV.length > 0 ? Math.min(...nonZeroV) : 1000;
      const minNonZeroL = nonZeroL.length > 0 ? Math.min(...nonZeroL) : 100;
      const logFloorV = Math.max(10, Math.pow(10, Math.floor(Math.log10(minNonZeroV))));
      const logFloorL = Math.max(1, Math.pow(10, Math.floor(Math.log10(minNonZeroL))));

      chartsRef.current.clusterChart = new Chart(clusterCtx, {
        type: "scatter",
        data: {
          datasets: [{
            label: "Upload Clusters",
            data: videoData.map(v => {
              const rawV = Number(v.views) || 0;
              const rawL = Number(v.likes) || 0;
              return {
                x: autoScopeClusters ? Math.max(logFloorV, rawV) : rawV,
                y: autoScopeClusters ? Math.max(logFloorL, rawL) : rawL,
                title: v.title,
                rawViews: rawV,
                rawLikes: rawL
              };
            }),
            backgroundColor: "rgba(255, 0, 0, 0.85)",
            hoverBackgroundColor: "#FF0000",
            borderColor: "#ffffff",
            borderWidth: 1.5,
            pointRadius: 6,
            pointHoverRadius: 9
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "nearest",
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1e1e1e",
              titleColor: "#ffffff",
              titleFont: { weight: "700", size: 12 },
              bodyColor: "#cccccc",
              borderColor: "rgba(255, 255, 255, 0.15)",
              borderWidth: 1,
              padding: 10,
              callbacks: {
                title: (items) => {
                  const p = items[0].raw;
                  return p.title ? p.title : "Video";
                },
                label: (ctx) => {
                  const p = ctx.raw;
                  const ratio = p.rawViews > 0 ? ((p.rawLikes / p.rawViews) * 100).toFixed(2) : "0.00";
                  return [
                    ` Views: ${p.rawViews.toLocaleString()}`,
                    ` Likes: ${p.rawLikes.toLocaleString()}`,
                    ` Engagement Ratio: ${ratio}%`,
                    autoScopeClusters ? ` Scale: Auto-Scoped (Log)` : ` Scale: Linear`
                  ];
                }
              }
            }
          },
          scales: {
            x: { 
              type: autoScopeClusters ? "logarithmic" : "linear",
              min: autoScopeClusters ? logFloorV : 0,
              grid: { color: "rgba(255, 255, 255, 0.05)" }, 
              ticks: { 
                color: "#aaaaaa", 
                font: { size: 10 },
                callback: (v) => {
                  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
                  if (v >= 1e6) return (v / 1e6).toFixed(0) + "M";
                  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
                  if (v >= 1) return v;
                  return "";
                }
              },
              title: { 
                display: true, 
                text: autoScopeClusters ? "Views (Auto-Scoped Log)" : "Views", 
                color: "#717171",
                font: { size: 10, weight: "600" }
              }
            },
            y: { 
              type: autoScopeClusters ? "logarithmic" : "linear",
              min: autoScopeClusters ? logFloorL : 0,
              grid: { color: "rgba(255, 255, 255, 0.05)" }, 
              ticks: { 
                color: "#aaaaaa", 
                font: { size: 10 },
                callback: (v) => {
                  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
                  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
                  if (v >= 1) return v;
                  return "";
                }
              },
              title: { 
                display: true, 
                text: autoScopeClusters ? "Likes (Auto-Scoped Log)" : "Likes", 
                color: "#717171",
                font: { size: 10, weight: "600" }
              }
            }
          }
        }
      });
    }

    // 4. Duration Optimization Analysis (Dual Axis for Views & Likes)
    const durationCtx = document.getElementById("durationChart");
    if (durationCtx && durationData.length > 0) {
      chartsRef.current.durationChart = new Chart(durationCtx, {
        type: "bar",
        data: {
          labels: durationData.map(d => d.duration),
          datasets: [
            {
              label: "Avg Views",
              data: durationData.map(d => d.avg_views),
              backgroundColor: "rgba(255, 0, 0, 0.8)",
              hoverBackgroundColor: "#FF0000",
              borderRadius: 4,
              yAxisID: "yViews",
              minBarLength: 8
            },
            {
              label: "Avg Likes",
              data: durationData.map(d => d.avg_likes),
              backgroundColor: "rgba(62, 166, 255, 0.8)",
              hoverBackgroundColor: "#3ea6ff",
              borderRadius: 4,
              yAxisID: "yLikes",
              minBarLength: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "nearest",
            intersect: false
          },
          plugins: {
            legend: { 
              position: "top", 
              align: "end",
              labels: { color: "#aaaaaa", boxWidth: 12, font: { size: 11, weight: "600" } } 
            },
            tooltip: {
              backgroundColor: "#1e1e1e",
              borderColor: "rgba(255, 255, 255, 0.15)",
              borderWidth: 1,
              titleColor: "#ffffff",
              callbacks: {
                label: (ctx) => {
                  const val = Number(ctx.parsed.y) || 0;
                  return ` ${ctx.dataset.label}: ${val.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#aaaaaa", font: { weight: "600" } } },
            yViews: { 
              type: "linear",
              position: "left",
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { 
                color: "#ff4d4d",
                font: { size: 10 },
                callback: (v) => v >= 1e6 ? (v/1e6).toFixed(0) + "M" : v >= 1e3 ? (v/1e3).toFixed(0) + "K" : v
              },
              title: { display: true, text: "Avg Views (Left)", color: "#ff4d4d", font: { size: 10, weight: "600" } }
            },
            yLikes: { 
              type: "linear",
              position: "right",
              grid: { display: false },
              ticks: { 
                color: "#3ea6ff",
                font: { size: 10 },
                callback: (v) => v >= 1e3 ? (v/1e3).toFixed(0) + "K" : v
              },
              title: { display: true, text: "Avg Likes (Right)", color: "#3ea6ff", font: { size: 10, weight: "600" } }
            }
          }
        }
      });
    }

    // 5. Category Doughnut Chart
    const categoryCtx = document.getElementById("categoryChart");
    if (categoryCtx && Object.keys(categoryData).length > 0) {
      chartsRef.current.categoryChart = new Chart(categoryCtx, {
        type: "doughnut",
        data: {
          labels: Object.keys(categoryData),
          datasets: [{
            data: Object.values(categoryData),
            backgroundColor: ["#FF0000", "#3ea6ff", "#ffffff", "#f59e0b", "#10b981"],
            borderColor: "#181818",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "nearest",
            intersect: false
          },
          plugins: {
            legend: { position: "bottom", labels: { color: "#aaaaaa", boxWidth: 10, font: { size: 11 } } }
          },
          cutout: "68%"
        }
      });

      const mostFrequentCategory = Object.keys(categoryData).reduce((a, b) =>
        categoryData[a] > categoryData[b] ? a : b
      );
      setCategoryLabel(mostFrequentCategory);
    }
  }, [autoScopeViews, autoScopeClusters]);

  // Auto-render charts whenever channelData updates
  useEffect(() => {
    if (!channelData) return;
    const timer = setTimeout(() => {
      renderCharts(
        channelData.analytics?.videos || [],
        channelData.analytics?.keyword_analysis || [],
        channelData.content?.duration_analysis || [],
        channelData.content?.category_analysis || {}
      );
    }, 60);
    return () => clearTimeout(timer);
  }, [channelData, renderCharts]);

  // Initial load: automatically load default channel
  useEffect(() => {
    const initial = localStorage.getItem("smat_selected_channel") || "MrBeast";
    setChannelName(initial);
    fetchData(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* Top Header - YouTube Studio Aesthetic */}
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
                Graph Topology
              </span>
              <span style={{ fontSize: "12px", color: "#aaaaaa" }}>TF-IDF Keyword Extraction & Clustering</span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: "800",
              letterSpacing: "-0.02em",
              color: "#ffffff"
            }}>
              InsightSphere | Channel Topology & Content Vectors
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#aaaaaa", fontSize: "0.88rem" }}>
              Uncover keyword term weights, engagement clusters, duration sweet-spots, and thematic niches.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            

            <button
              type="button"
              onClick={handleViewReport}
              disabled={!channelData}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: channelData ? "#FF0000" : "#212121",
                color: channelData ? "#ffffff" : "#717171",
                border: "none",
                padding: "8px 18px",
                borderRadius: "18px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: channelData ? "pointer" : "not-allowed",
                transition: "background 0.15s ease"
              }}
            >
              <FileText size={14} />
              <span>Export Topology Audit</span>
            </button>
          </div>
        </div>

        {/* Search Bar - YouTube Studio Surface */}
        <div style={{
          background: "#181818",
          border: "1px solid #272727",
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.75rem"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 340px", position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaaaaa" }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchData(); }}
                placeholder="Enter YouTube Channel name (e.g., MrBeast, CarryMinati, T-Series)..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px 10px 42px",
                  background: "#0f0f0f",
                  border: "1px solid #303030",
                  borderRadius: "20px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              style={{
                padding: "10px 24px",
                background: "#FF0000",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                cursor: loading ? "wait" : "pointer",
                fontSize: "13px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.15s ease"
              }}
            >
              {loading ? "Computing Topology..." : "Analyze Topology"}
            </button>
          </div>

          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#aaaaaa" }}>
            <span>Presets:</span>
            {["MrBeast", "CarryMinati", "T-Series"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => { setChannelName(name); fetchData(name); }}
                style={{
                  background: "#212121",
                  border: "1px solid #303030",
                  borderRadius: "14px",
                  padding: "4px 12px",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Metrics Strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem"
        }}>
          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "10px", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "12px", color: "#aaaaaa", fontWeight: "600", textTransform: "uppercase" }}>Subscriber Scale</div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
              {subscribers}
            </div>
            <div style={{ fontSize: "11px", color: "#717171", marginTop: "3px" }}>Verified audience scale</div>
          </div>

          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "10px", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "12px", color: "#aaaaaa", fontWeight: "600", textTransform: "uppercase" }}>Total Platform Impressions</div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#FF0000", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
              {views}
            </div>
            <div style={{ fontSize: "11px", color: "#717171", marginTop: "3px" }}>Cumulative video view impressions</div>
          </div>

          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "10px", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "12px", color: "#aaaaaa", fontWeight: "600", textTransform: "uppercase" }}>Published Catalog Depth</div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#3ea6ff", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
              {videos}
            </div>
            <div style={{ fontSize: "11px", color: "#717171", marginTop: "3px" }}>Ingested catalog node count</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "12px", padding: "1.25rem 1.5rem", minHeight: "380px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Upload Views Trajectory</div>
                <div style={{ fontSize: "11px", color: "#aaaaaa", marginTop: "2px" }}>
                  {autoScopeViews 
                    ? "Auto-scoped logarithmic distribution — every upload is elevated & cursor-hoverable" 
                    : "Standard linear impression performance"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoScopeViews(!autoScopeViews)}
                title="Toggle Auto-Scope to make all videos clearly visible vs standard linear"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: autoScopeViews ? "rgba(255, 0, 0, 0.15)" : "#212121",
                  border: autoScopeViews ? "1px solid rgba(255, 0, 0, 0.4)" : "1px solid #333333",
                  color: autoScopeViews ? "#ff5252" : "#aaaaaa",
                  borderRadius: "14px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: autoScopeViews ? "#FF0000" : "#717171",
                  display: "inline-block"
                }} />
                <span>{autoScopeViews ? "Auto-Scope: ON (All Visible)" : "Linear Scale"}</span>
              </button>
            </div>

            <div style={{ height: "240px", marginTop: "0.5rem" }}><canvas id="viewsChart"></canvas></div>

            {/* Quick Video Selector & Inspector Ribbon for easy cursor inspection */}
            <div style={{ marginTop: "12px", borderTop: "1px solid #272727", paddingTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#aaaaaa", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Video Quick-Inspect &bull; Hover or Tap Any Upload
                </span>
                <span style={{ fontSize: "10px", color: "#717171" }}>
                  {(channelData?.analytics?.videos || []).length} Uploads Tracked
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
                {(channelData?.analytics?.videos || []).map((v, i) => {
                  const isSelected = selectedVideo?.index === i;
                  const vViews = Number(v.views) || 0;
                  const fmt = vViews >= 1e6 ? (vViews / 1e6).toFixed(1) + "M" : vViews >= 1e3 ? (vViews / 1e3).toFixed(0) + "K" : vViews;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedVideo({ ...v, index: i })}
                      onMouseEnter={() => setSelectedVideo({ ...v, index: i })}
                      style={{
                        flex: "0 0 auto",
                        padding: "3px 8px",
                        background: isSelected ? "#FF0000" : "#212121",
                        color: isSelected ? "#ffffff" : "#cccccc",
                        border: isSelected ? "1px solid #FF0000" : "1px solid #303030",
                        borderRadius: "6px",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.12s ease"
                      }}
                    >
                      <strong style={{ color: isSelected ? "#ffffff" : "#FF0000" }}>#{i + 1}</strong>
                      <span style={{ fontSize: "10px", opacity: 0.85 }}>({fmt})</span>
                    </button>
                  );
                })}
              </div>

              {selectedVideo && (
                <div style={{
                  marginTop: "8px",
                  background: "#202020",
                  border: "1px solid rgba(255, 0, 0, 0.3)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px"
                }}>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ background: "#FF0000", color: "#ffffff", fontSize: "10px", fontWeight: "800", padding: "1px 5px", borderRadius: "3px" }}>
                        #{selectedVideo.index + 1}
                      </span>
                      <strong style={{ fontSize: "12px", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "340px", display: "inline-block" }}>
                        {selectedVideo.title}
                      </strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "14px", fontSize: "11px" }}>
                    <span>
                      <strong style={{ color: "#ff4d4d", fontSize: "12px" }}>
                        {Number(selectedVideo.views || 0).toLocaleString()}
                      </strong> <span style={{ color: "#aaaaaa" }}>views</span>
                    </span>
                    <span>
                      <strong style={{ color: "#3ea6ff", fontSize: "12px" }}>
                        {Number(selectedVideo.likes || 0).toLocaleString()}
                      </strong> <span style={{ color: "#aaaaaa" }}>likes</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "12px", padding: "1.25rem 1.5rem", minHeight: "340px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Semantic Lexicon Frequency (TF-IDF)</div>
              <span style={{ fontSize: "10px", background: "rgba(62, 166, 255, 0.15)", color: "#3ea6ff", border: "1px solid rgba(62, 166, 255, 0.3)", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                TF-IDF
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#aaaaaa", marginBottom: "1rem" }}>High-yield title and description keywords</div>
            <div style={{ height: "260px", position: "relative", flex: 1 }}><canvas id="keywordChart"></canvas></div>
          </div>

          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "12px", padding: "1.25rem 1.5rem", minHeight: "340px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Views vs Likes Engagement Clusters</div>
              <button
                type="button"
                onClick={() => setAutoScopeClusters(!autoScopeClusters)}
                title="Toggle Auto-Scope to space out clusters vs standard linear"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: autoScopeClusters ? "rgba(62, 166, 255, 0.15)" : "#212121",
                  border: autoScopeClusters ? "1px solid rgba(62, 166, 255, 0.4)" : "1px solid #333333",
                  color: autoScopeClusters ? "#3ea6ff" : "#aaaaaa",
                  borderRadius: "14px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: autoScopeClusters ? "#3ea6ff" : "#717171",
                  display: "inline-block"
                }} />
                <span>{autoScopeClusters ? "Auto-Scope: ON" : "Linear Scale"}</span>
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "#aaaaaa", marginBottom: "1rem" }}>
              {autoScopeClusters 
                ? "Separated multi-order cluster mapping — prevents outlier clumping" 
                : "Audience interaction and affinity density"}
            </div>
            <div style={{ height: "260px" }}><canvas id="clusterChart"></canvas></div>
          </div>

          <div style={{ background: "#181818", border: "1px solid #272727", borderRadius: "12px", padding: "1.25rem 1.5rem", minHeight: "340px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Duration Bracket Benchmarks</div>
              <span style={{ fontSize: "10px", background: "rgba(255, 255, 255, 0.08)", color: "#aaaaaa", border: "1px solid #333333", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                Dual-Axis Scaled
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#aaaaaa", marginBottom: "1rem" }}>
              Average view & like volume across runtime bins (Views on Left, Likes on Right)
            </div>
            <div style={{ height: "260px" }}><canvas id="durationChart"></canvas></div>
          </div>
        </div>

        {/* Detected Category Banner */}
        {categoryLabel !== "--" && (
          <div style={{
            background: "#181818",
            border: "1px solid #272727",
            borderRadius: "12px",
            padding: "1.25rem 1.75rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem"
          }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#aaaaaa" }}>Dominant Catalog Taxonomy</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#FF0000", marginTop: "4px" }}>
                Niche: {categoryLabel}
              </div>
              <p style={{ margin: "4px 0 0 0", color: "#aaaaaa", fontSize: "12px" }}>
                Classified from channel metadata, semantic term weights, and cluster density.
              </p>
            </div>
            <div style={{ width: "200px", height: "160px" }}>
              <canvas id="categoryChart"></canvas>
            </div>
          </div>
        )}

        {/* Video Uploads List */}
        {subscribers !== "--" && (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>
                Catalog Nodes & Cluster Assignments
              </h2>
              <div style={{ fontSize: "11px", color: "#aaaaaa" }}>Ingested upload metrics and cluster tags</div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px"
            }}>
              {(channelData?.analytics?.videos || []).map((video, index) => {
                const isShort = video.duration && video.duration < 60;
                const viewsFormatted = (video.views || 0) >= 1e6
                  ? ((video.views || 0) / 1e6).toFixed(1) + "M"
                  : (video.views || 0) >= 1e3
                    ? ((video.views || 0) / 1e3).toFixed(0) + "K"
                    : (video.views || 0);

                return (
                  <div key={index} style={{
                    background: "#181818",
                    border: "1px solid #272727",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", lineHeight: "1.4", flex: 1 }}>
                          {video.title}
                        </div>
                        {isShort && (
                          <span style={{ fontSize: "10px", fontWeight: "700", color: "#ffffff", background: "#FF0000", padding: "1px 6px", borderRadius: "3px", marginLeft: "6px" }}>
                            Short
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "#aaaaaa", marginBottom: "8px" }}>
                        {viewsFormatted} views &bull; {video.likes ? Number(video.likes).toLocaleString() : 0} likes
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", borderTop: "1px solid #272727", paddingTop: "8px" }}>
                      {video.category && (
                        <span style={{ fontSize: "10px", background: "rgba(62, 166, 255, 0.12)", color: "#3ea6ff", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                          {video.category}
                        </span>
                      )}
                      {video.cluster && (
                        <span style={{ fontSize: "10px", background: "rgba(255, 0, 0, 0.12)", color: "#ff4d4d", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                          {video.cluster}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default YouTubeAnalytics;
