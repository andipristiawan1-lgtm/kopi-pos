import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import Home from "./pages/landing/Home";
import Menu from "./pages/landing/Menu";
import Order from "./pages/landing/Order"; // <-- TAMBAHKAN
import OrderSuccess from "./pages/landing/OrderSuccess"; // <-- TAMBAHKAN

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />

          {/* Ganti Placeholder dengan komponen asli */}
          <Route path="/order" element={<Order />} />
          <Route
            path="/order/success/:orderNumber"
            element={<OrderSuccess />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
