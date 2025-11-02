// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
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
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";

const paypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: import.meta.env.VITE_PAYPAL_CURRENCY || "USD",
  intent: "capture",
};

const App = () => (
  <PayPalScriptProvider options={paypalOptions}>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
          <Route
            element={
              <PrivateRoute>
                <ResponsiveLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
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
  </PayPalScriptProvider>
);

export default App;
