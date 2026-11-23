import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import Home from "./pages/landing/Home";
import Menu from "./pages/landing/Menu";
import Order from "./pages/landing/Order"; // <-- TAMBAHKAN
import OrderSuccess from "./pages/landing/OrderSuccess"; // <-- TAMBAHKAN
import PosDashboard from "./pages/pos/PosDashboard";
import Login from "./pages/auth/Login";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order/success/:orderNumber" element={<OrderSuccess />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Rute Kasir (Proteksi) */}
        <Route path="/pos" element={
          <RequireAuth>
            <PosDashboard />
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}