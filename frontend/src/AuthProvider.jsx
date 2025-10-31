import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const API_URL = "http://127.0.0.1:8000/api/";
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(localStorage.getItem("access"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh"));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("isLoggedIn"));
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("username");
  const userEmail = localStorage.getItem("userEmail");
  const userJoined = localStorage.getItem("userJoined");
  console.log("userAuthId==>",userName)



  // ---------------- Logout ----------------
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/"); // redirect to login/home
  };

  // ---------------- Refresh Token ----------------
  const refreshAccessToken = async () => {
    if (!refreshToken) return null;
    try {
      const res = await axios.post(`${API_URL}token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess = res.data.access;
      setAccessToken(newAccess);
      localStorage.setItem("access", newAccess);
      return newAccess;
    } catch (err) {
      console.error("Token refresh failed:", err);
      handleLogout();
      return null;
    }
  };

  // ---------------- Secure Request Wrapper ----------------
  const secureRequest = async (axiosCall) => {
    try {
      return await axiosCall(); // try original request
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // retry original request with new token
          return await axiosCall(newToken);
        }
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userName,
        handleLogout,
        setIsLoggedIn,
        refreshAccessToken,
        secureRequest,
        accessToken,
        userId,
        userEmail,
        userJoined
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export { AuthContext };
