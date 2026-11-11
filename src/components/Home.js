import React from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Activity, 
  Network, 
  Users, 
  FileText, 
  Sparkles, 
  LogIn, 
  Lock 
} from "lucide-react";
import InsightSphere3DCanvas from './InsightSphere3DCanvas';
import NavBar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  return (
    <div className="App" style={{ minHeight: "100vh", background: "#0f0f0f", color: "#ffffff" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        body {
          background-color: #0f0f0f;
          color: #ffffff;
          line-height: 1.6;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .hero {
          padding: 4.5rem 5% 4rem;
          text-align: center;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 0, 0, 0.12);
          border: 1px solid rgba(255, 0, 0, 0.3);
          color: #ff4d4d;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 4px 12px;
          border-radius: 14px;
          margin-bottom: 1rem;
        }

        .hero-title {
          font-size: 3.25rem;
          font-weight: 900;
          margin-bottom: 1.25rem;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #ffffff;
        }

        .hero-title span {
          color: #FF0000;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: #aaaaaa;
          margin-bottom: 2rem;
          line-height: 1.6;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-container {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 5;
        }

        .cta-button {
          padding: 12px 28px;
          border-radius: 24px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          border: none;
        }

        .primary-cta {
          background: #FF0000;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(255, 0, 0, 0.35);
        }

        .primary-cta:hover {
          background: #cc0000;
          transform: translateY(-1px);
        }

        .secondary-cta {
          background: #212121;
          color: #ffffff;
          border: 1px solid #303030;
        }

        .secondary-cta:hover {
          background: #2e2e2e;
          transform: translateY(-1px);
        }

        .features {
          padding: 4rem 5% 6rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: #181818;
          border: 1px solid #272727;
          border-radius: 12px;
          padding: 1.75rem;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .feature-card:hover {
          border-color: #FF0000;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(255, 0, 0, 0.15);
        }

        .feature-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FF0000;
          margin-bottom: 1.25rem;
        }

        .feature-card h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .feature-card p {
          color: #aaaaaa;
          font-size: 0.88rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.3rem;
          }
        }
      `}} />

      {/* Unified YouTube Studio Navbar */}
      <NavBar />

      {/* Content */}
      <div className="content-wrapper">
        <Hero />
        <Features />
      </div>
    </div>
  );
}

const Hero = () => {
  const { isAuthenticated, openLoginModal } = useAuth();

  return (
    <section className="hero">
      {/* 3D Animated Interactive Particle Sphere */}
      <div style={{ maxWidth: "550px", margin: "0 auto -20px auto" }}>
        <InsightSphere3DCanvas height="240px" radius={105} nodeCount={60} />
      </div>

      <div className="hero-pill">
        <span>▶ InsightSphere Intelligence</span>
      </div>
      <h1 className="hero-title">
        YouTube Creator Analytics & <span>Audience Intelligence</span>
      </h1>
      <p className="hero-subtitle">
        Real-time sentiment polarity modeling, comment attention heatmaps, content topology graphs, and verified creator intelligence.
      </p>
      <div className="cta-container">
        <Link to="/dashboard-analytics" className="cta-button primary-cta">
          <BarChart3 size={17} />
          <span>Open Trending Dashboard</span>
        </Link>
        {!isAuthenticated ? (
          <button 
            onClick={() => openLoginModal("", "InsightSphere Analytics")} 
            className="cta-button secondary-cta"
          >
            <LogIn size={17} />
            <span>Login with Secure OTP</span>
          </button>
        ) : (
          <Link to="/sentiment-analysis" className="cta-button secondary-cta">
            <Activity size={17} />
            <span>Open Creator Analytics Studio</span>
          </Link>
        )}
      </div>
    </section>
  );
};

const Features = () => {
  const { isAuthenticated, openLoginModal } = useAuth();

  const handleProtectedClick = (e, targetUrl, featureTitle) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal(targetUrl, featureTitle);
    }
  };

  return (
    <section className="features">
      <div className="features-grid">
        {/* Public: Dashboard */}
        <Link to="/dashboard-analytics" className="feature-card" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="feature-icon-box">
              <BarChart3 size={22} />
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              background: '#222222',
              border: '1px solid #333333',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: '10px',
              textTransform: 'uppercase'
            }}>
              Public Preview
            </span>
          </div>
          <h3>Live Regional Trending</h3>
          <p>Real-time trending intelligence across 10 global regions with 16:9 media cards, velocity tracking, and lexical wordclouds.</p>
        </Link>

        {/* Protected: Sentiment */}
        <Link 
          to="/sentiment-analysis" 
          onClick={(e) => handleProtectedClick(e, "/sentiment-analysis", "Audience Sentiment & Attention")}
          className="feature-card" 
          style={{ textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="feature-icon-box">
              <Activity size={22} />
            </div>
            {!isAuthenticated && (
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                background: 'rgba(255, 0, 0, 0.12)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff4d4d',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Lock size={10} /> Login Required
              </span>
            )}
          </div>
          <h3>Audience Sentiment & Attention</h3>
          <p>VADER polarity scoring, 7×24 weekly comment attention density heatmaps, Random Forest view reach forecasting, and optimal posting times.</p>
        </Link>

        {/* Protected: Topology */}
        <Link 
          to="/network-visualization" 
          onClick={(e) => handleProtectedClick(e, "/network-visualization", "Content Topology Graph")}
          className="feature-card" 
          style={{ textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="feature-icon-box">
              <Network size={22} />
            </div>
            {!isAuthenticated && (
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                background: 'rgba(255, 0, 0, 0.12)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff4d4d',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Lock size={10} /> Login Required
              </span>
            )}
          </div>
          <h3>Content Topology Graph</h3>
          <p>TF-IDF title and description semantic vectorization, views-to-likes engagement clustering, and duration bracket performance optimization.</p>
        </Link>

        {/* Protected: Influencers */}
        <Link 
          to="/influencer-detection" 
          onClick={(e) => handleProtectedClick(e, "/influencer-detection", "Influencer Verification & Benchmark")}
          className="feature-card" 
          style={{ textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="feature-icon-box">
              <Users size={22} />
            </div>
            {!isAuthenticated && (
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                background: 'rgba(255, 0, 0, 0.12)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff4d4d',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Lock size={10} /> Login Required
              </span>
            )}
          </div>
          <h3>Influencer Verification & Benchmark</h3>
          <p>Interactive geographic world map, verified engagement rate calculations, subscriber tier segmentation, and influencer reach audits.</p>
        </Link>

        {/* Protected: Recommendations */}
        <Link 
          to="/recommendations" 
          onClick={(e) => handleProtectedClick(e, "/recommendations", "Category Channel Discovery")}
          className="feature-card" 
          style={{ textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="feature-icon-box">
              <Sparkles size={22} />
            </div>
            {!isAuthenticated && (
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                background: 'rgba(255, 0, 0, 0.12)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff4d4d',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Lock size={10} /> Login Required
              </span>
            )}
          </div>
          <h3>Category Channel Discovery</h3>
          <p>Curated creator recommendations spanning 13 YouTube categories with verified subscriber and lifetime impression benchmarks.</p>
        </Link>

        {/* Protected: Reports */}
        <Link 
          to="/reports" 
          onClick={(e) => handleProtectedClick(e, "/reports", "Executive Reports Studio")}
          className="feature-card" 
          style={{ textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="feature-icon-box">
              <FileText size={22} />
            </div>
            {!isAuthenticated && (
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                background: 'rgba(255, 0, 0, 0.12)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: '#ff4d4d',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Lock size={10} /> Login Required
              </span>
            )}
          </div>
          <h3>Executive Reports Studio</h3>
          <p>Generate 300 DPI vector-crisp PDF audits, CSV datasets, and automated TLS SMTP email dispatches with domain validation.</p>
        </Link>
      </div>
    </section>
  );
};
