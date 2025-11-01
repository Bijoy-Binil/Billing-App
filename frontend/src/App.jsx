// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Stock from "./pages/Stock";
import ProfitReport from "./pages/Reports/ProfitReport";
import SalesReport from "./pages/Reports/SalesReport";
import StockReport from "./pages/Reports/StockReport";
import AuthProvider from "./AuthProvider";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import ResponsiveLayout from "./ResponsiveLayout";


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 🔓 Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* 🔒 Protected Routes (Layout wraps all) */}
          <Route
            element={
              <PrivateRoute>
                <ResponsiveLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/stocks" element={<Stock />} />
            <Route path="/profit-report" element={<ProfitReport />} />
            <Route path="/sales-report" element={<SalesReport />} />
            <Route path="/stock-report" element={<StockReport />} />
          </Route>
        </Routes>
        
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
