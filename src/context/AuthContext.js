import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("insightsphere_user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Error parsing stored user in AuthContext:", e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("insightsphere_token") || null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetFeature, setTargetFeature] = useState({ url: "", name: "" });

  // Sync state if storage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "insightsphere_user") {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (err) {
          setCurrentUser(null);
        }
      }
      if (e.key === "insightsphere_token") {
        setToken(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData, userToken) => {
    setCurrentUser(userData);
    localStorage.setItem("insightsphere_user", JSON.stringify(userData));
    if (userToken) {
      setToken(userToken);
      localStorage.setItem("insightsphere_token", userToken);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("insightsphere_user");
    localStorage.removeItem("insightsphere_token");
  };

  const openLoginModal = (targetUrl = "", featureName = "") => {
    setTargetFeature({
      url: targetUrl || "",
      name: featureName || "InsightSphere Analytics"
    });
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const isAuthenticated = Boolean(currentUser && currentUser.email);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated,
        isLoginModalOpen,
        targetFeature,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
