import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import Home from "./pages/landing/Home";
import Menu from "./pages/landing/Menu";
import Order from "./pages/landing/Order";
import OrderSuccess from "./pages/landing/OrderSuccess";
import PosDashboard from "./pages/pos/PosDashboard";
import Login from "./pages/auth/Login";
import RequireAuth from "./components/RequireAuth";
import MenuManager from "./pages/admin/MenuManager";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StoreProfile from "./pages/admin/StoreProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik (dengan Navbar) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />

          {/* RUTE ORDER (HARUS BERADA DI ATAS SUCCESS) */}
          <Route path="/order" element={<Order />} />

          {/* RUTE SUCCESS (MEMILIKI PARAMETER) */}
          <Route
            path="/order/success/:orderNumber"
            element={<OrderSuccess />}
          />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Rute Kasir (Proteksi) */}
        <Route
          path="/pos"
          element={
            <RequireAuth>
              <PosDashboard />
            </RequireAuth>
          }
        />

        {/* Rute Admin/Owner (Proteksi) */}
        <Route
          path="/admin/menu"
          element={
            <RequireAuth>
              <MenuManager />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <RequireAuth>
              <StoreProfile />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
