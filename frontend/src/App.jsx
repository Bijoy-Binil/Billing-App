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
import AuthProvider from "./AuthProvider";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";



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
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
                <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="/stocks" element={<PrivateRoute><Stock /></PrivateRoute>} />
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
