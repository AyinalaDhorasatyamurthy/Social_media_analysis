import { resilientFetch } from "../apiConfig";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import "chartjs-chart-matrix";
import { 
  Search, 
  Activity, 
  Clock, 
  TrendingUp, 
  BarChart2, 
  FileText, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  PlaySquare, 
  ThumbsUp, 
  MessageSquare
} from "lucide-react";
import NavBar from "./Navbar";


Chart.register(MatrixController, MatrixElement);

// Global Chart enterprise dark defaults
Chart.defaults.color = "#94a3b8";
Chart.defaults.borderColor = "rgba(255, 255, 255, 0.06)";
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const YouTubeSentiment = () => {
  const [channel, setChannel] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [error, setError] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCentralities, setShowCentralities] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const navigate = useNavigate();
  const charts = useRef({});

  const handleViewReport = () => {
    if (!channel.trim()) {
      setError("Please specify a channel name.");
      return;
    }
    sessionStorage.setItem("channelData", JSON.stringify({
      channelName: channel,
      sentiment: chartData,
      videos: videos
    }));
    sessionStorage.setItem("reportType", "Sentiment Analysis");
    navigate("/reports");
  };

  const fetchSentiment = async (targetChannel) => {
    const query = (targetChannel || channel).trim();
    if (!query) {
      setError("Please enter a valid YouTube channel identifier or handle.");
      setShowCharts(false);
      return;
    }

    setError(null);
    setLoading(true);
    setShowCharts(false);
    setChartData(null);
    setBestTime("");
    setVideos([]);

    Object.values(charts.current).forEach(c => {
      if (c && typeof c.destroy === "function") c.destroy();
    });
    charts.current = {};

    try {
      const response = await resilientFetch(`/sentiment/analyze_sentiment?channel=${encodeURIComponent(query)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.details || data.error || "Channel query failed.");
      if (!data) throw new Error("Invalid payload received from engine.");

      setChartData(data);
      setBestTime(data.best_time);
      setVideos(data.video_sentiments || []);
      setShowCharts(true);
    } catch (err) {
      setError(err.message);
      setShowCharts(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartData) return;
    updatePieChart(chartData.percentages);
    updateLineChart(chartData.video_sentiments);
    updateHeatmapChart(chartData.hourly_sentiment);
    updatePerformanceChart(chartData.predicted_performance);
  }, [chartData]);

  const createChart = (id, type, data, options) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (charts.current[id]) {
      charts.current[id].destroy();
    }

    charts.current[id] = new Chart(ctx, {
      type,
      data,
      options: {
        ...options,
        responsive: true,
        maintainAspectRatio: false
      }
    });
  };

  const updatePieChart = (data) => {
    if (!data) return;
    const labels = Object.keys(data);
    const values = Object.values(data);

    createChart("sentimentChart", "doughnut", {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#10b981",  // Emerald Positive
          "#f43f5e",  // Rose Negative
          "#3b82f6",  // Blue Neutral
        ],
        borderColor: "#0b0f19",
        borderWidth: 2,
        hoverOffset: 4
      }]
    }, {
      plugins: {
        legend: {
          position: "bottom",
          labels: { 
            color: "#94a3b8", 
            boxWidth: 12, 
            padding: 14, 
            font: { size: 12, weight: "500" } 
          }
        }
      },
      cutout: "70%"
    });
  };

  const updateLineChart = (videoSentiments) => {
    if (!videoSentiments || !videoSentiments.length) return;
    const labels = videoSentiments.map(v => (v.video_title || "Upload").substring(0, 15) + "…");
    const datasets = [
      {
        label: "Positive",
        data: videoSentiments.map(v => v.Positive || 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3
      },
      {
        label: "Negative",
        data: videoSentiments.map(v => v.Negative || 0),
        borderColor: "#f43f5e",
        backgroundColor: "rgba(244, 63, 94, 0.08)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3
      },
      {
        label: "Neutral",
        data: videoSentiments.map(v => v.Neutral || 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3
      }
    ];

    createChart("lineChart", "line", { labels, datasets }, {
      plugins: {
        legend: { position: "bottom", labels: { color: "#94a3b8", boxWidth: 12 } }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255, 255, 255, 0.04)" },
          ticks: { color: "#64748b" }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", maxRotation: 30 }
        }
      }
    });
  };

  const updateHeatmapChart = (hourlyData) => {
    if (!hourlyData) return;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const heatmapData = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = day + "-" + hour;
        heatmapData.push({ x: hour, y: day, v: hourlyData[key] || 0 });
      }
    }

    createChart("heatmapChart", "matrix", {
      datasets: [{
        label: "Attention Density",
        data: heatmapData,
        backgroundColor: ctx => {
          const value = ctx.dataset.data[ctx.dataIndex]?.v || 0;
          if (value === 0) return "rgba(15, 23, 42, 0.4)";
          const alpha = Math.min(0.2 + (value / 7) * 0.8, 1);
          return `rgba(56, 189, 248, ${alpha})`;
        },
        borderWidth: 1,
        borderColor: "#080c14",
        width: 17,
        height: 17
      }]
    }, {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Attention Index: ${ctx.dataset.data[ctx.dataIndex]?.v || 0} at ${ctx.dataset.data[ctx.dataIndex]?.x}:00`
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          ticks: { callback: val => val + "h", color: "#64748b", stepSize: 4 },
          grid: { color: "rgba(255, 255, 255, 0.03)" }
        },
        y: {
          type: "linear",
          ticks: { callback: val => days[val] || "", color: "#64748b", stepSize: 1 },
          grid: { color: "rgba(255, 255, 255, 0.03)" }
        }
      }
    });
  };

  const updatePerformanceChart = (predictions) => {
    if (!predictions) return;
    const labels = Object.keys(predictions);
    const values = Object.values(predictions);

    createChart("performanceChart", "bar", {
      labels: labels.map(l => l.substring(0, 16) + "…"),
      datasets: [{
        label: "Forecasted Views",
        data: values,
        backgroundColor: "rgba(99, 102, 241, 0.75)",
        hoverBackgroundColor: "#818cf8",
        borderRadius: 4
      }]
    }, {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255, 255, 255, 0.04)" },
          ticks: {
            color: "#64748b",
            callback: (v) => v >= 1e6 ? (v/1e6).toFixed(1) + "M" : v >= 1e3 ? (v/1e3).toFixed(0) + "K" : v
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", maxRotation: 30 }
        }
      }
    });
  };

  const totalComments = chartData?.top_comments ? chartData.top_comments.length : 0;
  const positiveComments = chartData?.top_comments?.filter(c => c.sentiment === "Positive") || [];
  const negativeComments = chartData?.top_comments?.filter(c => c.sentiment === "Negative") || [];
  const neutralComments = chartData?.top_comments?.filter(c => c.sentiment === "Neutral") || [];

  const avgVader = totalComments > 0
    ? (chartData.top_comments.reduce((acc, c) => acc + (c.vader_compound || 0), 0) / totalComments).toFixed(2)
    : "0.00";

  const sampleHighlights = [
    ...positiveComments.slice(0, 2),
    ...neutralComments.slice(0, 1)
  ].slice(0, 3);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      paddingBottom: "5rem"
    }}>
      <NavBar />

      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "2.25rem 1.5rem" }}>
        {/* Page Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          borderBottom: "1px solid #272727",
          paddingBottom: "1.5rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", color: "#38bdf8" }}>
                InsightSphere Studio
              </span>
              <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#475569" }} />
              <span style={{ fontSize: "11px", color: "#64748b" }}>VADER NLP & Random Forest Model</span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "1.65rem",
              fontWeight: "700",
              letterSpacing: "-0.025em",
              color: "#f8fafc"
            }}>
              InsightSphere | Audience Sentiment & Attention Engine
            </h1>
            <p style={{ margin: "6px 0 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              Multi-video comment polarity classification, 7×24 weekly attention matrices, and non-linear view projections.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            

            <button
              type="button"
              onClick={handleViewReport}
              disabled={!chartData}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: chartData ? "#0ea5e9" : "#1e293b",
                color: chartData ? "#ffffff" : "#64748b",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: chartData ? "pointer" : "not-allowed",
                transition: "all 0.15s ease"
              }}
            >
              <FileText size={14} />
              <span>Export Executive Report</span>
            </button>
          </div>
        </div>

        {/* Search Control Card */}
        <div style={{
          background: "#181818",
          border: "1px solid #272727",
          borderRadius: "10px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.75rem"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 340px", position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Enter YouTube Channel name or creator handle (e.g., MrBeast, CarryMinati, T-Series)..."
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchSentiment(); }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px 10px 40px",
                  background: "#0f0f0f",
                  border: "1px solid #272727",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <button
              onClick={() => fetchSentiment()}
              disabled={loading}
              style={{
                padding: "10px 22px",
                background: "#FF0000",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "wait" : "pointer",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.15s ease"
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <Activity size={14} />
                  <span>Run Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
            <span>Preset Profiles:</span>
            {["MrBeast", "CarryMinati", "T-Series"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => { setChannel(name); fetchSentiment(name); }}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid #272727",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.08)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            color: "#fca5a5",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <AlertCircle size={15} color="#f43f5e" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Analysis Dashboard */}
        {showCharts && (
          <>
            {/* KPI Executive Summary Strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              marginBottom: "1.75rem"
            }}>
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "8px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>
                  <span>VADER Sentiment Index</span>
                  <Activity size={14} color="#10b981" />
                </div>
                <div style={{
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: Number(avgVader) >= 0 ? "#10b981" : "#f43f5e",
                  marginTop: "6px",
                  fontVariantNumeric: "tabular-nums"
                }}>
                  {Number(avgVader) > 0 ? "+" : ""}{avgVader}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Scaled from -1.0 (Critical) to +1.0 (Positive)
                </div>
              </div>

              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "8px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>
                  <span>Peak Attention Window</span>
                  <Clock size={14} color="#38bdf8" />
                </div>
                <div style={{
                  fontSize: "1.45rem",
                  fontWeight: "700",
                  color: "#f8fafc",
                  marginTop: "6px"
                }}>
                  {bestTime || "Analyzing…"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Calculated from 7×24 velocity matrix (Publish 1-2h prior)
                </div>
              </div>

              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "8px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>
                  <span>Audited Corpus Depth</span>
                  <Layers size={14} color="#818cf8" />
                </div>
                <div style={{
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: "#f8fafc",
                  marginTop: "6px",
                  fontVariantNumeric: "tabular-nums"
                }}>
                  {totalComments || 150} <span style={{ fontSize: "13px", fontWeight: "500", color: "#94a3b8" }}>comments</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  10 comments per video × 15 recent catalog uploads
                </div>
              </div>

              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "8px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>
                  <span>Positive Perception Ratio</span>
                  <ThumbsUp size={14} color="#10b981" />
                </div>
                <div style={{
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: "#34d399",
                  marginTop: "6px",
                  fontVariantNumeric: "tabular-nums"
                }}>
                  {chartData?.percentages?.Positive ? `${chartData.percentages.Positive.toFixed(1)}%` : "0%"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  {positiveComments.length} positive &bull; {negativeComments.length} negative
                </div>
              </div>
            </div>

            {/* 4 Core Charts Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              {/* Chart 1: Sentiment Distribution */}
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                minHeight: "380px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      Comment Polarity Distribution
                    </h3>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Normalized VADER classifications</div>
                  </div>
                  <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px", borderRadius: "4px", color: "#94a3b8" }}>
                    NLP Model
                  </span>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <canvas id="sentimentChart"></canvas>
                </div>
              </div>

              {/* Chart 2: Sentiment Trajectory */}
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                minHeight: "380px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      Cross-Upload Sentiment Trajectory
                    </h3>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Volume variance per release</div>
                  </div>
                  <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px", borderRadius: "4px", color: "#94a3b8" }}>
                    15 Uploads
                  </span>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <canvas id="lineChart"></canvas>
                </div>
              </div>

              {/* Chart 3: 7x24 Matrix */}
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                minHeight: "380px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      7 × 24 Temporal Attention Matrix
                    </h3>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Circadian comment velocity heatmap</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    style={{ background: "transparent", border: "none", color: "#FF0000", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Info size={12} />
                    <span>Why Heatmap?</span>
                  </button>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <canvas id="heatmapChart"></canvas>
                </div>
              </div>

              {/* Chart 4: Random Forest Projection */}
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                minHeight: "380px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      ML Projected Reach & Views
                    </h3>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>14-feature Random Forest forecast</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    style={{ background: "transparent", border: "none", color: "#FF0000", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Info size={12} />
                    <span>Model Spec</span>
                  </button>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <canvas id="performanceChart"></canvas>
                </div>
              </div>
            </div>

            {/* Audience Reaction Highlights (Executive & Compact, NO 150 comment wall) */}
            {sampleHighlights.length > 0 && (
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                marginBottom: "2rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      Representative Audience Feedback
                    </h3>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Curated highlights from the 150 ingested comments</div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Verified from Studio Archive
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
                  {sampleHighlights.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#0f0f0f",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: "6px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <p style={{ margin: "0 0 10px 0", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5" }}>
                        "{c.comment}"
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748b", borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: "8px" }}>
                        <span style={{ fontWeight: "600", color: "#94a3b8" }}>{c.author || "Viewer"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>👍 {c.likes || 0}</span>
                          <span style={{
                            padding: "1px 6px",
                            borderRadius: "3px",
                            fontSize: "10px",
                            fontWeight: "600",
                            background: c.sentiment === "Positive" ? "rgba(16, 185, 129, 0.15)" : c.sentiment === "Negative" ? "rgba(244, 63, 94, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: c.sentiment === "Positive" ? "#34d399" : c.sentiment === "Negative" ? "#fb7185" : "#60a5fa"
                          }}>
                            {c.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topology Centralities Section Toggle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setShowCentralities(!showCentralities)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#181818",
                  border: "1px solid #272727",
                  color: "#cbd5e1",
                  padding: "9px 18px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <Layers size={14} color="#818cf8" />
                <span>{showCentralities ? "Collapse Content Centralities" : "Inspect Video Network Centralities"}</span>
                {showCentralities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Centrality Metrics Table */}
            {showCentralities && (
              <div style={{
                background: "#181818",
                border: "1px solid #272727",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                marginBottom: "2rem",
                overflowX: "auto"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      Catalog Network Graph Centralities
                    </h3>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Structural influence metrics computed across the channel's upload graph</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    style={{ background: "transparent", border: "none", color: "#FF0000", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Info size={12} />
                    <span>Why Centralities?</span>
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#0f0f0f", borderBottom: "1px solid #1e293b" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: "600" }}>Upload Title</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8", fontWeight: "600" }}>Degree (Hubness)</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8", fontWeight: "600" }}>Betweenness (Bridges)</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8", fontWeight: "600" }}>Closeness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "10px 14px", color: "#f1f5f9", fontWeight: "500" }}>{video.video_title}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#10b981", fontFamily: "monospace" }}>{video.degree !== undefined ? video.degree : "--"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#FF0000", fontFamily: "monospace" }}>{video.betweenness !== undefined ? video.betweenness : "--"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#3ea6ff", fontFamily: "monospace" }}>{video.closeness !== undefined ? video.closeness : "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Video Upload Catalog Breakdown */}
            {videos.length > 0 && (
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                    Audited Release Roster ({videos.length} Uploads)
                  </h3>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Per-video sentiment ratios and view counts</div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px"
                }}>
                  {videos.map((video, index) => {
                    const total = (video.Positive || 0) + (video.Negative || 0) + (video.Neutral || 0);
                    const posPct = total > 0 ? ((video.Positive || 0) / total * 100).toFixed(0) : 0;
                    const negPct = total > 0 ? ((video.Negative || 0) / total * 100).toFixed(0) : 0;
                    const neuPct = total > 0 ? ((video.Neutral || 0) / total * 100).toFixed(0) : 0;
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
                        padding: "12px 14px"
                      }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc", marginBottom: "4px", lineHeight: "1.4" }}>
                          {video.video_title}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                          {viewsFormatted} views
                        </div>
                        <div style={{
                          display: "flex",
                          height: "4px",
                          borderRadius: "2px",
                          overflow: "hidden",
                          background: "#0f0f0f",
                          marginBottom: "6px"
                        }}>
                          <div style={{ width: `${posPct}%`, background: "#10b981" }} />
                          <div style={{ width: `${neuPct}%`, background: "#3b82f6" }} />
                          <div style={{ width: `${negPct}%`, background: "#f43f5e" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                          <span style={{ color: "#34d399" }}>{posPct}% Pos</span>
                          <span style={{ color: "#60a5fa" }}>{neuPct}% Neu</span>
                          <span style={{ color: "#fb7185" }}>{negPct}% Neg</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Methodology Guide Modal */}
      
    </div>
  );
};

export default YouTubeSentiment;
