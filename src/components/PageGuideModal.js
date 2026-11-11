import React, { useState } from "react";
import styled from "styled-components";
import { 
  X, 
  Activity, 
  Network, 
  Users, 
  FileText, 
  Code2
} from "lucide-react";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const ModalCard = styled.div`
  background: #181818;
  border: 1px solid #272727;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  width: 100%;
  max-width: 920px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #ffffff;
`;

const ModalHeader = styled.div`
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #272727;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #181818;

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .icon-box {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: rgba(255, 0, 0, 0.15);
      border: 1px solid rgba(255, 0, 0, 0.3);
      color: #FF0000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
    }

    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(255, 0, 0, 0.12);
      color: #ff4d4d;
      border: 1px solid rgba(255, 0, 0, 0.25);
    }
  }

  .close-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #aaaaaa;
    width: 32px;
    height: 32px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: #272727;
      color: #ffffff;
    }
  }
`;

const ModuleNav = styled.div`
  display: flex;
  background: #121212;
  border-bottom: 1px solid #272727;
  padding: 0 1.25rem;
  overflow-x: auto;
`;

const NavTab = styled.button`
  background: transparent;
  border: none;
  border-bottom: ${(props) => (props.$active ? "2px solid #FF0000" : "2px solid transparent")};
  color: ${(props) => (props.$active ? "#ffffff" : "#aaaaaa")};
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  font-size: 0.85rem;
  padding: 0.85rem 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
  }
`;

const ContentBody = styled.div`
  padding: 1.75rem;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #aaaaaa;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #272727;
    border-radius: 3px;
  }
`;

const ParameterCard = styled.div`
  background: #212121;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  padding: 1.1rem 1.25rem;
  margin-bottom: 1rem;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: #3f3f3f;
  }

  .param-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.45rem;
  }

  .param-name {
    font-size: 0.92rem;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .param-tag {
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
    color: #aaaaaa;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .param-desc {
    font-size: 0.85rem;
    color: #aaaaaa;
    margin: 0;
    line-height: 1.55;
  }

  .formula-box {
    margin-top: 0.65rem;
    background: #141414;
    border: 1px solid #272727;
    border-radius: 6px;
    padding: 8px 12px;
    font-family: ui-monospace, monospace;
    font-size: 0.8rem;
    color: #3ea6ff;
  }
`;

const SPECIFICATIONS = {
  sentiment: {
    title: "InsightSphere | Sentiment & Attention Engine",
    badge: "NLP / ML Reference",
    icon: Activity,
    summary: "Audience sentiment and attention dynamics are modeled using multi-video comment ingestion, Lexicon and Rule-Based NLP (VADER), 7×24 temporal matrices, and Random Forest view forecasting.",
    parameters: [
      {
        name: "VADER Compound Polarity",
        tag: "NLP Metric",
        desc: "Valence Aware Dictionary and sEntiment Reasoner (VADER) computes a normalized sentiment score between -1.0 (extremely negative) and +1.0 (extremely positive). The algorithm accounts for emojis, punctuation intensifiers, capitalization, and sentiment-altering conjunctions.",
        formula: "compound = x / sqrt(x^2 + 15), where x = sum of valence ratings"
      },
      {
        name: "7 × 24 Temporal Attention Matrix (Why Heatmap?)",
        tag: "Temporal Density",
        desc: "Why Heatmap? Standard time-series line charts only plot historical dates and fail to expose cyclical audience habits. The 7×24 weekly matrix maps comment density across every hour (00:00–23:00 UTC) of each day (Monday–Sunday) to identify recurring peak attention windows.",
        formula: "density(d, h) = Sum of comments published on weekday d at hour h"
      },
      {
        name: "Reach & View Forecasting Model",
        tag: "Random Forest Regressor",
        desc: "How it predicts reach? Uses a Random Forest Ensemble trained on 14 feature vectors: historical view trajectory, like-to-view ratio, comment velocity, VADER sentiment valence, video duration buckets, and network graph centrality multipliers.",
        formula: "Y_pred = (1 / B) * Sum(T_b(X)), trained on 14-dimensional feature vector X"
      },
      {
        name: "Optimal Publishing Slot (Best Time to Post)",
        tag: "Algorithmic Timing",
        desc: "Calculates the exact weekday and UTC hour of peak positive comment velocity. Publishing 60–120 minutes prior to this slot maximizes YouTube's initial 24-hour recommendation momentum.",
        formula: "t_optimal = argmax(Velocity_positive(weekday, hour)) - 1.5 hours"
      },
      {
        name: "Content Topology Centrality (Why Centralities?)",
        tag: "Network Theory",
        desc: "Why Centralities? Maps videos into a semantic graph: Degree Centrality measures content hubness (flagship videos), Betweenness Centrality identifies bridge topics that attract viewers across different playlists, and Closeness Centrality reflects rapid discovery across the creator catalog.",
        formula: "C_D(v) = deg(v) / (N - 1); C_B(v) = Sum(sigma_st(v) / sigma_st)"
      },
      {
        name: "Distributed Multi-Video Ingestion",
        tag: "Data Integrity",
        desc: "Samples up to 15 recent videos and shorts, extracting 10 comments per upload (150 total). This eliminates single-video bias and provides a statistically representative audit of the creator's full audience.",
        formula: "Corpus = Union of Top 10 comments across 15 recent uploads (150 sample size)"
      }
    ]
  },
  network: {
    title: "InsightSphere | Content Topology & Semantic Graph",
    badge: "Graph Theory",
    icon: Network,
    summary: "Constructs semantic graphs of videos, categories, and tags using TF-IDF vectorization and cosine similarity to uncover content authority clusters and audience discovery paths.",
    parameters: [
      {
        name: "TF-IDF Semantic Vectorization",
        tag: "NLP Vector Space",
        desc: "Converts video titles and descriptions into numerical vector embeddings based on term frequency and inverse document frequency across the creator's corpus.",
        formula: "tfidf(t, d, D) = tf(t, d) * log(|D| / |{d in D : t in d}|)"
      },
      {
        name: "Cosine Similarity Edge Weights",
        tag: "Graph Edge Metric",
        desc: "Constructs undirected weighted edges between video nodes whenever their semantic similarity exceeds the threshold (w > 0.25).",
        formula: "similarity(u, v) = (u . v) / (||u|| * ||v||)"
      },
      {
        name: "Engagement Clustering (Scatter Matrix)",
        tag: "Audience Response",
        desc: "Partitions uploads into Low, Medium, and High engagement quadrants based on views-to-likes ratios and duration brackets.",
        formula: "cluster_k = argmin(Sum(||x_i - mu_k||^2))"
      }
    ]
  },
  influencer: {
    title: "InsightSphere | Creator Verification & Benchmarking",
    badge: "Audit Criteria",
    icon: Users,
    summary: "Benchmarks creators against global standards, evaluating audience authenticity, engagement rates, and geographic concentration.",
    parameters: [
      {
        name: "Verified Engagement Rate (ER %)",
        tag: "Engagement Metric",
        desc: "Evaluates active community participation against the global platform benchmark (1.5%–4.5%).",
        formula: "ER (%) = ((Total Likes + Total Comments) / Total Views) * 100"
      },
      {
        name: "Tier Segmentation",
        tag: "Audience Scale",
        desc: "Mega (>1M subscribers), Macro (500K–1M), Mid-Tier (100K–500K), Micro (10K–100K), and Nano (<10K).",
        formula: "Segment = f(Subscriber_Count, Monthly_Active_Viewers)"
      },
      {
        name: "Geographic Distribution",
        tag: "Audience Demographics",
        desc: "Standardized ISO alpha-2 country codes projected onto an interactive vector map for geographic target analysis.",
        formula: "Geo_reach = Map(Country_Code, Regional_Impressions)"
      }
    ]
  },
  reports: {
    title: "InsightSphere | Executive Export & Automated Delivery",
    badge: "Delivery Architecture",
    icon: FileText,
    summary: "Aggregates multi-module intelligence into executive deliverables across PDF print-ready vector styles, CSV metrics tables, and authenticated RFC 5322 SMTP dispatch.",
    parameters: [
      {
        name: "Vector-Crisp Executive PDF",
        tag: "Export Standard",
        desc: "Clean self-contained document rendered with print-optimized media queries, containing KPIs, sentiment breakdowns, and strategic AI takeaways.",
        formula: "Standard CSS @media print with 300 DPI vector fidelity"
      },
      {
        name: "Automated SMTP Dispatch",
        tag: "Delivery Protocol",
        desc: "Transmits reports directly to recipient inboxes via Google authenticated TLS SMTP with typo domain detection.",
        formula: "SMTP over TLS (Port 587) with RFC 5322 MIME multiparts"
      }
    ]
  }
};

export default function PageGuideModal({ module = "sentiment", isOpen, onClose }) {
  const [activeModule, setActiveModule] = useState(module);
  const spec = SPECIFICATIONS[activeModule] || SPECIFICATIONS.sentiment;
  const Icon = spec.icon;

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <ModalHeader>
          <div className="title-group">
            <div className="icon-box">
              <Icon size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2>{spec.title}</h2>
            </div>
            <span className="badge">{spec.badge}</span>
          </div>

          <button className="close-btn" onClick={onClose} title="Close Guide">
            <X size={17} strokeWidth={2} />
          </button>
        </ModalHeader>

        {/* Tab Selection */}
        <ModuleNav>
          <NavTab 
            $active={activeModule === "sentiment"} 
            onClick={() => setActiveModule("sentiment")}
          >
            <Activity size={14} />
            <span>Sentiment & Attention</span>
          </NavTab>
          <NavTab 
            $active={activeModule === "network"} 
            onClick={() => setActiveModule("network")}
          >
            <Network size={14} />
            <span>Topology & Graph</span>
          </NavTab>
          <NavTab 
            $active={activeModule === "influencer"} 
            onClick={() => setActiveModule("influencer")}
          >
            <Users size={14} />
            <span>Creator Verification</span>
          </NavTab>
          <NavTab 
            $active={activeModule === "reports"} 
            onClick={() => setActiveModule("reports")}
          >
            <FileText size={14} />
            <span>Reports & Delivery</span>
          </NavTab>
        </ModuleNav>

        {/* Content Body */}
        <ContentBody>
          <div style={{ marginBottom: "1.25rem", color: "#aaaaaa", fontSize: "0.88rem" }}>
            {spec.summary}
          </div>

          <div>
            {spec.parameters.map((p, i) => (
              <ParameterCard key={i}>
                <div className="param-header">
                  <div className="param-name">
                    <Code2 size={15} color="#FF0000" />
                    <span>{p.name}</span>
                  </div>
                  <span className="param-tag">{p.tag}</span>
                </div>
                <p className="param-desc">{p.desc}</p>
                {p.formula && (
                  <div className="formula-box">
                    {p.formula}
                  </div>
                )}
              </ParameterCard>
            ))}
          </div>
        </ContentBody>
      </ModalCard>
    </Overlay>
  );
}
