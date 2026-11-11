import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/LoginModal";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import NetworkVisualization from "./components/NetworkVisualization";
import InfluencerDetection from "./components/InfluencerDetection";
import SentimentAnalysis from "./components/SentimentAnalysis";
import DashboardAnalytics from "./components/DashboardAnalytics";
import Reports from "./components/Reports";
import Recommendations from "./components/Recommendations";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Global Login Pop-Up Modal for Mandatory Authentication */}
        <LoginModal />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/dashboard-analytics" element={<DashboardAnalytics />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes (Mandatory Login Step) */}
          <Route 
            path="/sentiment-analysis" 
            element={
              <ProtectedRoute featureName="Audience Sentiment & Attention Matrix">
                <SentimentAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/network-visualization" 
            element={
              <ProtectedRoute featureName="Content Semantic Topology Graph">
                <NetworkVisualization />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/influencer-detection" 
            element={
              <ProtectedRoute featureName="Influencer Verification & Benchmark">
                <InfluencerDetection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recommendations" 
            element={
              <ProtectedRoute featureName="Channel & Creator Discovery Engine">
                <Recommendations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute featureName="Executive Reports & Export Studio">
                <Reports />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
