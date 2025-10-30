import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";
import Stock from "./pages/Stock";
import AuthProvider from "../AuthProvider";

const App = () => {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps the entire app so all children share context */}
      <AuthProvider>
        <div className="flex">
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 min-h-screen flex flex-col">
            <TopNav />

            {/* Routes Section */}
            <main className="flex-1 p-8">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/stocks" element={<Stock />} />
              </Routes>
            </main>

            {/* Footer always visible */}
            <Footer />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
